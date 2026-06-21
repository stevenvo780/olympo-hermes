import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * IdempotencyKey: Persiste claves de idempotencia procesadas.
 *
 * Cuando el webhook de pagos llega con x-idempotency-key, verificamos si ya
 * fue procesada. Si sí → retornamos el resultado cacheado (sin re-procesar).
 *
 * TTL: 24h (tiempo de expiración de una clave).
 * Índice: idempotencyKey (unique) para búsqueda O(1).
 */
@Entity()
@Index(['idempotencyKey'], { unique: true })
@Index(['expiresAt'])
export class IdempotencyKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * La clave de idempotencia (ej: UUID enviado por el cliente).
   */
  @Column({ type: 'varchar', unique: true })
  idempotencyKey: string;

  /**
   * El resultado cacheado (JSON serializado de la respuesta).
   * Se retorna al cliente sin re-procesar si la clave repite.
   */
  @Column({ type: 'jsonb' })
  cachedResponse: Record<string, unknown>;

  /**
   * El código HTTP de la respuesta (200, 400, 500, etc).
   */
  @Column({ type: 'int', default: 200 })
  statusCode: number;

  /**
   * Timestamp de expiración. Después de esto, la clave se puede reutilizar.
   * Típicamente 24h desde la creación.
   */
  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
