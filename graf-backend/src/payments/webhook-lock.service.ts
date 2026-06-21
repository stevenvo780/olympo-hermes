import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdempotencyKey } from './entities/idempotency-key.entity';

/**
 * Token DI para un cliente Redis OPCIONAL.
 *
 * Hermes hoy NO tiene un cliente Redis cableado (no hay paquete ioredis/redis
 * instalado ni provider que lo instancie). Por eso este token resuelve a `null`
 * salvo que un módulo lo provea. Cuando se cablee Redis basta con registrar:
 *
 *   { provide: REDIS_LOCK_CLIENT, useFactory: () => new Redis(...) }
 *
 * y el lock pasa automáticamente al modo Redis (SET NX PX). Este archivo NO
 * importa ningún paquete Redis para no romper `tsc` cuando no está instalado:
 * el cliente se consume "duck-typed" vía {@link RedisLikeClient}.
 */
export const REDIS_LOCK_CLIENT = Symbol('REDIS_LOCK_CLIENT');

/** Subconjunto mínimo de un cliente Redis (ioredis/node-redis). Tipado estructural. */
export interface RedisLikeClient {
  set(
    key: string,
    value: string,
    mode?: string,
    duration?: number,
    flag?: string,
  ): Promise<string | null>;
  del(key: string): Promise<number>;
}

/**
 * Resultado de adquirir el lock.
 * - acquired=true  → este proceso procesa y luego finalize()/releaseOnFailure().
 * - acquired=false → otro proceso procesa la misma key concurrentemente; el
 *                    caller responde 409 (evita doble marcado de pedido pagado).
 */
export interface LockResult {
  acquired: boolean;
  backend: 'redis' | 'db' | 'noop';
}

/** Postgres unique_violation (índice UNIQUE en idempotency_key.idempotencyKey). */
const PG_UNIQUE_VIOLATION = '23505';

/**
 * WebhookLockService — locking DISTRIBUIDO para cerrar la race de idempotencia
 * de los webhooks de pago entrantes del Hub.
 *
 * Sin lock: dos webhooks idénticos (mismo x-idempotency-key) en paralelo, cada
 * uno en una instancia distinta de Cloud Run, ambos consultan idempotencia,
 * ninguno halla cache, ambos procesan → doble efecto (p.ej. doble
 * `markPaidByGateway` / doble fan-out de `pedido.pagado`).
 *
 * Backends (fail-closed):
 *   1. Redis (si hay cliente): SET key NX PX <ttl>.
 *   2. DB (fallback siempre disponible): INSERT atómico de un "claim" sobre la
 *      tabla `idempotency_key`; el índice UNIQUE garantiza un único ganador.
 */
@Injectable()
export class WebhookLockService {
  private readonly logger = new Logger(WebhookLockService.name);
  private readonly LOCK_TTL_MS = 60_000;

  constructor(
    @InjectRepository(IdempotencyKey)
    private readonly idempotencyKeyRepository: Repository<IdempotencyKey>,
    @Optional()
    @Inject(REDIS_LOCK_CLIENT)
    private readonly redis: RedisLikeClient | null,
  ) {
    this.logger.log(
      this.redis
        ? 'WebhookLockService: backend=Redis (SET NX PX)'
        : 'WebhookLockService: sin Redis → backend=DB (INSERT atómico sobre índice UNIQUE)',
    );
  }

  /** Intenta tomar el lock exclusivo para `idempotencyKey`. */
  async acquire(idempotencyKey: string): Promise<LockResult> {
    if (this.redis) {
      try {
        const res = await this.redis.set(
          `lock:idem:${idempotencyKey}`,
          '1',
          'PX',
          this.LOCK_TTL_MS,
          'NX',
        );
        return { acquired: res === 'OK', backend: 'redis' };
      } catch (err) {
        this.logger.warn(
          `Redis lock falló para ${idempotencyKey}: ${err?.message}. Fallback a DB claim.`,
        );
      }
    }

    // INSERT ... ON CONFLICT DO UPDATE ... WHERE expirado: una sola sentencia
    // atómica. El ganador inserta una fila "claim" nueva O reclama una EXPIRADA.
    // Si existe y NO está expirada (otro proceso la tiene o hay cache válido),
    // el UPDATE no aplica y RETURNING viene vacío → no adquirido. Cierra la race
    // sin Redis usando el índice UNIQUE de la tabla compartida.
    try {
      const expiresAt = new Date(Date.now() + this.LOCK_TTL_MS);
      const claim = JSON.stringify({ __claim: true });
      const rows = await this.idempotencyKeyRepository.query(
        `INSERT INTO "idempotency_key"
           ("idempotencyKey", "cachedResponse", "statusCode", "expiresAt")
         VALUES ($1, $2::jsonb, 0, $3)
         ON CONFLICT ("idempotencyKey") DO UPDATE
           SET "cachedResponse" = EXCLUDED."cachedResponse",
               "statusCode"     = 0,
               "expiresAt"      = EXCLUDED."expiresAt"
           WHERE "idempotency_key"."expiresAt" < now()
         RETURNING "id"`,
        [idempotencyKey, claim, expiresAt],
      );
      return { acquired: rows.length > 0, backend: 'db' };
    } catch (err) {
      const code = err?.code ?? err?.driverError?.code;
      if (code === PG_UNIQUE_VIOLATION) {
        return { acquired: false, backend: 'db' };
      }
      this.logger.error(
        `Error inesperado en DB claim para ${idempotencyKey}: ${err?.message}`,
      );
      // fail-closed: ante error de DB no procesamos a ciegas.
      return { acquired: false, backend: 'db' };
    }
  }

  /** Libera el lock tras un fallo, para permitir reintento inmediato del Hub. */
  async releaseOnFailure(idempotencyKey: string): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.del(`lock:idem:${idempotencyKey}`);
      } catch (err) {
        this.logger.warn(
          `Redis release falló para ${idempotencyKey}: ${err?.message}`,
        );
      }
    }
    try {
      await this.idempotencyKeyRepository.delete({
        idempotencyKey,
        statusCode: 0,
      });
    } catch (err) {
      this.logger.warn(
        `DB release falló para ${idempotencyKey}: ${err?.message}`,
      );
    }
  }

  /**
   * Confirma procesamiento EXITOSO: convierte el claim en cache de idempotencia
   * (respuesta + TTL) y libera el lock de Redis si lo había.
   */
  async finalize(
    idempotencyKey: string,
    cachedResponse: Record<string, unknown>,
    statusCode: number,
    ttlMs: number = 24 * 60 * 60 * 1000,
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlMs);
    try {
      const existing = await this.idempotencyKeyRepository.findOne({
        where: { idempotencyKey },
      });
      if (existing) {
        existing.cachedResponse = cachedResponse;
        existing.statusCode = statusCode;
        existing.expiresAt = expiresAt;
        await this.idempotencyKeyRepository.save(existing);
      } else {
        await this.idempotencyKeyRepository.save({
          idempotencyKey,
          cachedResponse,
          statusCode,
          expiresAt,
        });
      }
    } catch (err) {
      this.logger.warn(
        `finalize() no pudo persistir cache para ${idempotencyKey}: ${err?.message}`,
      );
    }

    if (this.redis) {
      try {
        await this.redis.del(`lock:idem:${idempotencyKey}`);
      } catch {
        /* el lock expira solo vía PX */
      }
    }
  }
}
