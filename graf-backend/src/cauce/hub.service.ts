import { Injectable, Logger } from '@nestjs/common';
import {
  HubClient,
  EVENTS,
  validateEvent,
  type EventEnvelope,
  type PublishOptions,
} from '@cauce/contracts';

/**
 * Cauce HubCentral integration for Graf (e-commerce backend).
 *
 * Graf is the SSOT of online orders, catalog and online customers, so it is the
 * OWNER (emitter) of these events (see ARCHITECTURE.md §4-5):
 *   - ORDER_PAID                 (pedido.pagado)
 *   - ORDER_PENDING_APPROVAL     (pedido.pendiente_aprobacion)
 *   - ORDER_APPROVED             (pedido.aprobado)
 *   - CUSTOMER_CREATED           (cliente.creado)
 *
 * The underlying HubClient is fault-tolerant by design: a failed publish never
 * throws into business logic (connectors are optional, principle §2). Every
 * helper here is therefore safe to `await` inline without try/catch.
 */
@Injectable()
export class CauceHubService {
  private readonly logger = new Logger(CauceHubService.name);

  private readonly client = new HubClient({
    source: 'graf',
    hubUrl: process.env.CAUCE_HUB_URL,
    secret: process.env.CAUCE_HUB_SECRET,
    // throwOnError stays false: never break the local e-commerce flow.
  });

  /** Whether the connector is enabled (opt-in via env, default on). */
  private get enabled(): boolean {
    return process.env.CAUCE_HUB_ENABLED !== 'false';
  }

  /**
   * Low-level publish. Validates the payload against the contract schema
   * (best-effort) and forwards to HubCentral. Returns true on success.
   */
  async publish(
    eventType: string,
    data: Record<string, unknown>,
    options: PublishOptions = {},
  ): Promise<boolean> {
    if (!this.enabled) return false;

    // Best-effort local validation so we don't emit obviously-broken events.
    const probe = validateEvent({
      eventType,
      data,
      eventId: '',
      timestamp: '',
      source: 'graf',
      priority: 'normal',
    } as EventEnvelope);
    if (!probe.ok) {
      const reason = (probe as { ok: false; error: string }).error;
      this.logger.warn(
        `[cauce] skipping invalid "${eventType}" event: ${reason}`,
      );
      return false;
    }

    try {
      return await this.client.publish(eventType, data, options);
    } catch (err) {
      // Defensive: HubClient already swallows network errors, but never let an
      // unexpected throw bubble into the business transaction.
      this.logger.warn(
        `[cauce] publish "${eventType}" failed (non-fatal): ${(err as Error).message}`,
      );
      return false;
    }
  }

  // --- Graf-owned event helpers -------------------------------------------

  /** Flow 1 — online order paid. Consumed by ApiSoftia, ApiSigo, MeraVuelta, EMW. */
  orderPaid(data: {
    orderId: string;
    customer: {
      id?: string;
      name?: string;
      phone?: string;
      email?: string;
    };
    items: Array<{
      sku: string;
      name?: string;
      qty: number;
      unitPrice: number;
    }>;
    total: number;
    currency?: string;
    paymentMethod?: 'online' | 'offline';
    store?: string;
  }): Promise<boolean> {
    return this.publish(EVENTS.ORDER_PAID, data, { priority: 'high' });
  }

  /** Flow 2 — offline order awaiting Sinergia approval. */
  orderPendingApproval(data: {
    orderId: string;
    customer: {
      id?: string;
      name?: string;
      phone?: string;
      email?: string;
    };
    total: number;
    store?: string;
  }): Promise<boolean> {
    return this.publish(EVENTS.ORDER_PENDING_APPROVAL, data);
  }

  /** Flow 2 — order approved (re-enters flow 1). */
  orderApproved(data: {
    orderId: string;
    approvedBy?: string;
  }): Promise<boolean> {
    return this.publish(EVENTS.ORDER_APPROVED, data);
  }

  /** Flow 5 — new online customer. Consumed by ApiSoftia (CRM). */
  customerCreated(data: {
    customer: {
      id?: string;
      name?: string;
      phone?: string;
      email?: string;
    };
  }): Promise<boolean> {
    return this.publish(EVENTS.CUSTOMER_CREATED, data);
  }
}
