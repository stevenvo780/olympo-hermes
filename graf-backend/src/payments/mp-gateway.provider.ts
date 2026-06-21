import { Logger } from '@nestjs/common';
import { MercadoPagoGateway, type PaymentGateway } from 'prizma-payments';

/**
 * DI token for the Mercado Pago payment gateway (central Prizma account).
 *
 * The gateway is injected behind the `PaymentGateway` interface (not the
 * concrete class) so tests can swap a mock and a future provider migration is a
 * one-line change here.
 */
export const MP_GATEWAY = 'MP_GATEWAY' as const;

const logger = new Logger('MercadoPagoGateway');

/**
 * Factory provider for the CENTRAL Mercado Pago account (Colombia / COP).
 *
 * Cuenta CENTRAL: NO hay OAuth ni credenciales por tienda. Un único access
 * token cobra todos los pedidos y suscripciones de Hermes; el Hub desambigua
 * por `externalReference` (`hermes:order:<id>` / `hermes:plan:<id>`).
 *
 * Lazy gateway: el constructor NUNCA lanza aunque falten credenciales — la app
 * arranca y solo falla al cobrar (`MercadoPagoNotConfiguredError`). Los secretos
 * se leen de env con placeholder seguro (`?? ''`); NUNCA se hardcodean.
 *
 *   MP_ACCESS_TOKEN   → crear checkouts/preapprovals y consultar su estado.
 *   MP_WEBHOOK_SECRET → verificar la firma `x-signature` (lo usa el Hub, no Hermes).
 *
 * Ver `.env.example`.
 */
export const mpGatewayProvider = {
  provide: MP_GATEWAY,
  useFactory: (): PaymentGateway => {
    const accessToken = process.env.MP_ACCESS_TOKEN ?? '';
    const webhookSecret = process.env.MP_WEBHOOK_SECRET ?? '';

    if (!accessToken) {
      logger.warn(
        'MP_ACCESS_TOKEN no configurado: los pagos/suscripciones fallarán al cobrar (lazy). La app arranca igual.',
      );
    }

    return new MercadoPagoGateway({
      accessToken,
      webhookSecret,
      sandbox: process.env.MP_SANDBOX_MODE === 'true',
    });
  },
};
