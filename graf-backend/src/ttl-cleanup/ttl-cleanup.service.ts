import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { PendingWompiSubscription } from '../wompi/entities/pending-wompi-subscription.entity';
import { IdempotencyKey } from '../payments/entities/idempotency-key.entity';

/**
 * TtlCleanupService: limpieza periódica de las tablas con TTL.
 *
 * Las tablas `pending_wompi_subscription` e `idempotency_key` crecen con cada
 * transacción y nunca se purgan solas; sus filas dejan de ser útiles una vez
 * vencido `expiresAt` (60s para Wompi pendiente, 24h para idempotencia). Sin
 * limpieza, la tabla crece sin límite y degrada los índices.
 *
 * Estrategia (fallback, ver `deferred`):
 *   - El paquete `@nestjs/schedule` NO está instalado en este backend, así que
 *     en lugar de `@Cron('0 * * * *')` usamos un `setInterval` administrado por
 *     el ciclo de vida del módulo (OnModuleInit/OnModuleDestroy). El intervalo
 *     se limpia en el shutdown para no filtrar timers (tests, reinicios).
 *   - Periodicidad: cada hora (CLEANUP_INTERVAL_MS). Además se ejecuta una
 *     pasada inicial poco después del arranque para no esperar la primera hora.
 *
 * FAIL-SAFE:
 *   - Sólo borra filas vencidas (`expiresAt < now()`), nunca filas vigentes.
 *   - Todo error se captura y registra; jamás se propaga al proceso (un fallo
 *     de limpieza no debe tumbar el backend de e-commerce).
 *   - Si no hay base de datos configurada (sin DB_HOST), no se programa nada,
 *     coherente con la carga condicional de TypeORM en AppModule.
 */
@Injectable()
export class TtlCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TtlCleanupService.name);

  /** Cada hora. */
  private readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

  /** Pequeño retardo tras el arranque para la primera pasada. */
  private readonly INITIAL_DELAY_MS = 30 * 1000;

  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private initialTimeout: ReturnType<typeof setTimeout> | null = null;
  /** Evita pasadas solapadas si una limpieza tarda más que el intervalo. */
  private running = false;

  constructor(
    @InjectRepository(PendingWompiSubscription)
    private readonly pendingWompiRepository: Repository<PendingWompiSubscription>,
    @InjectRepository(IdempotencyKey)
    private readonly idempotencyKeyRepository: Repository<IdempotencyKey>,
  ) {}

  onModuleInit(): void {
    // Sin DB no hay nada que limpiar (TypeORM no se carga en AppModule).
    if (!process.env.DB_HOST) {
      this.logger.log(
        'TTL cleanup deshabilitado: no hay DB_HOST configurado.',
      );
      return;
    }

    this.initialTimeout = setTimeout(() => {
      void this.runCleanup();
    }, this.INITIAL_DELAY_MS);
    // No mantener vivo el event loop sólo por estos timers.
    this.initialTimeout.unref?.();

    this.intervalHandle = setInterval(() => {
      void this.runCleanup();
    }, this.CLEANUP_INTERVAL_MS);
    this.intervalHandle.unref?.();

    this.logger.log(
      `TTL cleanup programado cada ${this.CLEANUP_INTERVAL_MS / 60000} min ` +
        `(setInterval; @nestjs/schedule no disponible).`,
    );
  }

  onModuleDestroy(): void {
    if (this.initialTimeout) {
      clearTimeout(this.initialTimeout);
      this.initialTimeout = null;
    }
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  /**
   * Ejecuta una pasada de limpieza sobre ambas tablas TTL.
   * Pública para poder dispararse manualmente (p.ej. desde un endpoint admin o
   * un test) sin esperar al intervalo. Nunca lanza.
   */
  async runCleanup(): Promise<void> {
    if (this.running) {
      this.logger.debug('TTL cleanup omitido: pasada previa en curso.');
      return;
    }
    this.running = true;
    const now = new Date();
    try {
      const pending = await this.deleteExpired(
        this.pendingWompiRepository,
        now,
        'pending_wompi_subscription',
      );
      const idempotency = await this.deleteExpired(
        this.idempotencyKeyRepository,
        now,
        'idempotency_key',
      );
      const total = pending + idempotency;
      if (total > 0) {
        this.logger.log(
          `TTL cleanup: ${pending} pending_wompi_subscription + ` +
            `${idempotency} idempotency_key eliminadas.`,
        );
      } else {
        this.logger.debug('TTL cleanup: sin filas vencidas.');
      }
    } catch (error) {
      // Defensa adicional; deleteExpired ya captura por tabla.
      this.logger.error(
        `TTL cleanup falló inesperadamente: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      this.running = false;
    }
  }

  /**
   * Borra las filas vencidas de un repositorio. Captura su propio error para
   * que un fallo en una tabla no impida limpiar la otra.
   */
  private async deleteExpired<T extends { expiresAt: Date }>(
    repository: Repository<T>,
    now: Date,
    tableLabel: string,
  ): Promise<number> {
    try {
      const result = await repository.delete({
        // FAIL-SAFE: sólo filas estrictamente vencidas.
        expiresAt: LessThan(now),
      } as Parameters<Repository<T>['delete']>[0]);
      return result.affected ?? 0;
    } catch (error) {
      this.logger.error(
        `TTL cleanup de ${tableLabel} falló: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return 0;
    }
  }
}
