import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Store } from 'src/store/entities/store.entity';
import * as crypto from 'crypto';

/**
 * 🌐 Servicio Universal de Eventos para Hermes Backend
 *
 * Este servicio permite a Hermes enviar TODOS los eventos al Hub Central
 * sin conocer qué plugins están habilitados. Hub Central maneja la
 * lógica de enrutamiento de plugins de forma inteligente.
 */
@Injectable()
export class UniversalEventService {
  private readonly logger = new Logger(UniversalEventService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 🎯 Método principal: Envía cualquier evento al Hub Central
   */
  async sendEvent(
    eventType: string,
    data: Record<string, unknown>,
    store: Store,
    userEmail?: string,
    options?: {
      throwOnError?: boolean;
      retryAttempts?: number;
      baseDelayMs?: number;
    },
  ): Promise<void> {
    const nousUrl = this.configService.get<string>('HUB_CENTRAL_URL');
    if (!nousUrl) {
      this.logger.warn('⚠️ HUB_CENTRAL_URL no configurada');
      return;
    }

    const retryAttempts =
      options?.retryAttempts ??
      Number(this.configService.get<string>('HUB_CENTRAL_RETRY_ATTEMPTS') ?? 3);
    const baseDelay =
      options?.baseDelayMs ??
      Number(
        this.configService.get<string>('HUB_CENTRAL_RETRY_BASE_MS') ?? 400,
      );
    const throwOnError = options?.throwOnError ?? true;

    const payload = this.buildUniversalPayload(eventType, data, store);
    const tenantId = this.generateTenantId(store);
    const apiKey =
      this.configService.get<string>('HUB_CENTRAL_SECRET') ||
      'nous_secure_key_2024';

    const signature = crypto
      .createHmac('sha256', apiKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
      'X-Tenant-Id': tenantId,
      'X-Source': 'hermes-backend',
      'X-Hermes-Signature': `sha256=${signature}`,
    };
    if (userEmail) headers['X-User-Email'] = userEmail;

    let attempt = 0;
    let lastError: Error | undefined;
    while (attempt < retryAttempts) {
      attempt++;
      try {
        await this.httpService.axiosRef.post(
          `${nousUrl}/api/v1/webhooks/hermes`,
          payload,
          { headers, timeout: 8000 },
        );
        if (attempt > 1) {
          this.logger.warn(
            `⚠️ Evento ${eventType} recuperado y enviado en reintento #${attempt} (tenant ${tenantId})`,
          );
        } else {
          this.logger.log(
            `✅ Evento ${eventType} enviado a Hub Central para tenant ${tenantId}${
              userEmail ? ` (user: ${userEmail})` : ''
            }`,
          );
        }
        return;
      } catch (err) {
        lastError = err;
        const networkMsg = err?.code || err?.message || 'unknown';
        if (attempt < retryAttempts) {
          const delay = this.calculateBackoff(baseDelay, attempt);
          this.logger.warn(
            `🔁 Fallo intento ${attempt}/${retryAttempts} enviando ${eventType} (tenant ${tenantId}) -> ${networkMsg}. Reintentando en ${delay}ms`,
          );
          await this.sleep(delay);
          continue;
        }
      }
    }

    this.logger.error(
      `❌ Evento ${eventType} NO enviado tras ${retryAttempts} intentos (tenant ${tenantId}). Último error: ${
        lastError?.message || lastError
      }`,
    );
    if (throwOnError) throw lastError;
  }

  /**
   * 🔧 Construye payload universal para cualquier evento
   */
  private buildUniversalPayload(
    eventType: string,
    data: Record<string, unknown>,
    store: Store,
  ): Record<string, unknown> {
    const userId =
      (data?.user as Record<string, unknown>)?.id || data?.userId || null;

    return {
      event_type: eventType,
      data: {
        store_id: store.id,
        ...data,
      },
      tenant_context: {
        store_id: store.id,
        user_id: userId,
        tenant_id: this.generateTenantId(store),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'hermes-backend',
        version: '2.0.0',
      },
    };
  }

  /**
   * 🏷️ Genera ID de tenant basado en la tienda
   */
  private generateTenantId(store: Store): string {
    return `hermes-store-${store.id}`;
  }

  private sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }

  private calculateBackoff(base: number, attempt: number): number {
    const exp = base * Math.pow(2, attempt - 1);
    const jitter = Math.floor(Math.random() * (base / 2));
    return Math.min(exp + jitter, 8000);
  }
}
