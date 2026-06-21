/**
 * Type stub for prizma-payments@1.0.1
 *
 * The published package is missing its .d.ts files. This stub provides the
 * minimum type surface used by Hermes so the TypeScript build succeeds.
 * Remove this file once prizma-payments ships with proper declarations.
 */
declare module 'prizma-payments' {
  export type EstadoPagoNormalizado = 'aprobado' | 'rechazado' | 'pendiente';
  export const MONEDA_DEFAULT: 'COP';

  export interface CheckoutItem {
    id?: string;
    title: string;
    description?: string;
    quantity: number;
    unit_price: number;
    currency_id?: string;
  }

  export interface PayerInput {
    email?: string;
    name?: string;
    surname?: string;
    phone?: { area_code?: string; number?: string };
  }

  export interface BackUrls {
    success?: string;
    failure?: string;
    pending?: string;
  }

  export interface PaymentMetadata {
    storeId?: string;
    orderId?: string;
    [key: string]: unknown;
  }

  export interface CreateCheckoutInput {
    items: CheckoutItem[];
    payer?: PayerInput;
    externalReference: string;
    notification_url?: string;
    metadata?: PaymentMetadata;
    back_urls?: BackUrls;
    statement_descriptor?: string;
    auto_return?: 'approved' | 'all';
    binary_mode?: boolean;
    idempotencyKey?: string;
  }

  export interface CheckoutResult {
    id: string;
    init_point: string;
    sandbox_init_point: string;
  }

  export interface AutoRecurring {
    frequency: number;
    frequency_type: 'months' | 'days';
    amount: number;
    currency?: string;
  }

  export interface CreateSubscriptionInput {
    payerEmail: string;
    reason: string;
    auto_recurring: AutoRecurring;
    externalReference: string;
    back_url: string;
    notification_url?: string;
    idempotencyKey?: string;
  }

  export interface SubscriptionResult {
    id: string;
    init_point: string;
    status: string;
  }

  export interface PaymentInfo {
    id: string;
    status: string;
    status_detail?: string;
    external_reference?: string;
    transaction_amount?: number;
    currency_id?: string;
    raw: unknown;
  }

  export interface PreapprovalInfo {
    id: string;
    status: string;
    external_reference?: string;
    reason?: string;
    next_payment_date?: string;
    raw: unknown;
  }

  export interface VerifyWebhookInput {
    headers: Record<string, string | string[] | undefined>;
    query: Record<string, string | string[] | undefined>;
    rawBody?: string | Buffer;
  }

  export interface VerifyWebhookResult {
    valid: boolean;
    reason?: string;
  }

  export interface MPWebhookPayload {
    id?: number | string;
    type?: string;
    action?: string;
    data?: { id?: string | number };
    topic?: string;
    resource?: string;
  }

  export interface ParsedWebhook {
    kind: 'payment' | 'subscription';
    mpId: string;
    status: EstadoPagoNormalizado;
    externalReference?: string;
  }

  export interface IdempotencyStore {
    has(mpId: string): boolean | Promise<boolean>;
    add(mpId: string): void | Promise<void>;
  }

  export interface PaymentGateway {
    createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult>;
    createSubscription(input: CreateSubscriptionInput): Promise<SubscriptionResult>;
    getPayment(id: string): Promise<PaymentInfo>;
    getPreapproval(id: string): Promise<PreapprovalInfo>;
    verifyWebhook(input: VerifyWebhookInput): VerifyWebhookResult;
    parseWebhook(payload: MPWebhookPayload): ParsedWebhook;
    mapStatus(mpStatus: string | undefined): EstadoPagoNormalizado;
  }

  export class MercadoPagoGateway implements PaymentGateway {
    constructor(config: { accessToken: string; webhookSecret?: string; sandbox?: boolean });
    createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult>;
    createSubscription(input: CreateSubscriptionInput): Promise<SubscriptionResult>;
    getPayment(id: string): Promise<PaymentInfo>;
    getPreapproval(id: string): Promise<PreapprovalInfo>;
    verifyWebhook(input: VerifyWebhookInput): VerifyWebhookResult;
    parseWebhook(payload: MPWebhookPayload): ParsedWebhook;
    mapStatus(mpStatus: string | undefined): EstadoPagoNormalizado;
  }

  export class MercadoPagoNotConfiguredError extends Error {}
  export class InMemoryIdempotencyStore implements IdempotencyStore {
    has(mpId: string): boolean;
    add(mpId: string): void;
  }

  export function buildIdempotencyKey(prefix: string, id: string): string;
  export function mapStatus(mpStatus: string | undefined): EstadoPagoNormalizado;
  export function parseWebhook(payload: MPWebhookPayload): ParsedWebhook;
  export function verifyWebhookSignature(input: VerifyWebhookInput & { secret: string }): VerifyWebhookResult;
  export function wasAlreadyProcessed(store: IdempotencyStore, mpId: string): Promise<boolean>;
}
