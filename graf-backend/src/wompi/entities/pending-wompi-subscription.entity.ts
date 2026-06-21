import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

/**
 * PendingWompiSubscription: Persiste el estado de suscripciones en tránsito.
 *
 * Cuando processSubscription inicia un webhook pendiente, se crea un registro
 * con transactionId (PK de Wompi, único para cada transacción).
 *
 * Problema resuelto:
 * - Map en memoria se pierde en reinicio/multi-instancia.
 * - Webhook llega a instancia distinta → NotFoundException.
 *
 * Solución:
 * - Persistir en DB con TTL (expiresAt).
 * - Buscar por transactionId (indexed).
 * - No es una "caché" sino un contrato de "estado pendiente".
 *
 * Limpieza:
 * - Cron o en handleWebhookEvent: eliminar si createdAt + TTL < now.
 */
@Entity()
@Index(['transactionId'], { unique: true })
@Index(['userId'])
@Index(['expiresAt'])
export class PendingWompiSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Wompi transaction ID (único por transacción, retornado en createTransaction).
   */
  @Column({ type: 'varchar', unique: true })
  transactionId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  /**
   * Datos de la suscripción pendiente (planType, frequency, sourceId).
   * Necesarios para recrear la suscripción si el webhook tarda.
   */
  @Column({ type: 'jsonb', nullable: true })
  subscriptionData: {
    planType: string;
    frequency: string;
    sourceId: number;
  };

  /**
   * Timestamp de expiración. Si expiresAt < now, el webhook se descarta.
   * TTL = 60s (igual al WEBHOOK_TIMEOUT de wompi.service).
   */
  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
