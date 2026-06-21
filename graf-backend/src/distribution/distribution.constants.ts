import { DistOrderStatus } from '../order/entities/order.entity';

/** Single-tenant demo store used by the distribution endpoints by default. */
export const DEFAULT_STORE_ID = process.env.DIST_STORE_ID || 'hermes-dist';

/**
 * Allowed transitions of the distribution order state machine.
 * en cola -> aceptado -> enrutado -> despachado (+ anular from any live state).
 */
export const ORDER_TRANSITIONS: Record<DistOrderStatus, DistOrderStatus[]> = {
  [DistOrderStatus.QUEUED]: [DistOrderStatus.ACCEPTED, DistOrderStatus.CANCELED],
  [DistOrderStatus.ACCEPTED]: [
    DistOrderStatus.ROUTED,
    DistOrderStatus.QUEUED,
    DistOrderStatus.CANCELED,
  ],
  [DistOrderStatus.ROUTED]: [
    DistOrderStatus.DISPATCHED,
    DistOrderStatus.ACCEPTED,
    DistOrderStatus.CANCELED,
  ],
  [DistOrderStatus.DISPATCHED]: [],
  [DistOrderStatus.CANCELED]: [],
};

/** Order can have its units edited only while it has not been routed yet. */
export const EDITABLE_STATUSES: DistOrderStatus[] = [
  DistOrderStatus.QUEUED,
  DistOrderStatus.ACCEPTED,
];
