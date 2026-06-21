import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TtlCleanupService } from './ttl-cleanup.service';
import { PendingWompiSubscription } from '../wompi/entities/pending-wompi-subscription.entity';
import { IdempotencyKey } from '../payments/entities/idempotency-key.entity';

/**
 * Módulo de limpieza automática de tablas con TTL.
 *
 * Registra `PendingWompiSubscription` e `IdempotencyKey` vía forFeature (para
 * inyectar sus repositorios) y arranca {@link TtlCleanupService}, que purga
 * cada hora las filas vencidas (`expiresAt < now()`).
 *
 * Nota: usa `setInterval` en lugar de `@Cron` porque `@nestjs/schedule` no está
 * instalado en este backend (ver `deferred` del cierre de Phase 2).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PendingWompiSubscription, IdempotencyKey]),
  ],
  providers: [TtlCleanupService],
  exports: [TtlCleanupService],
})
export class TtlCleanupModule {}
