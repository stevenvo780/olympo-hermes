import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SharedProp } from '../../common/entities/sharedProp.helper';
import { Store } from '../../store/entities/store.entity';

@Entity()
export class DeliveryZone extends SharedProp {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    description: 'Identificador único de la zona de entrega',
    example: 1,
  })
  id: number;

  @Column({ type: 'varchar' })
  @ApiProperty({
    description: 'Nombre de la zona de entrega',
    example: 'Centro',
  })
  zone: string;

  @Column('numeric', { precision: 10, scale: 2, default: 0 })
  @ApiProperty({
    description: 'Precio de envío para la zona',
    example: 5.0,
  })
  price: number;

  @Column('numeric', { precision: 10, scale: 2, nullable: true, default: null })
  @ApiProperty({
    description:
      'Monto mínimo del pedido para obtener envío gratis. Si es null, no aplica envío gratis.',
    example: 50000,
    required: false,
  })
  freeShippingThreshold?: number;

  @Column({ type: 'varchar', nullable: true })
  @ApiProperty({
    description: 'Tiempo estimado de entrega',
    example: '30-45 min',
    required: false,
  })
  estimatedTime: string;

  // --- Distribution routing fields ---

  @Column({ type: 'varchar', nullable: true })
  @ApiProperty({
    description: 'Código interno de la zona/ruta',
    example: 'med-norte',
    required: false,
  })
  code?: string;

  @Column({ type: 'varchar', nullable: true, name: 'routegroup' })
  @ApiProperty({
    description: 'Agrupación de la ruta (p.ej. Medellín, Oriente, Bogotá)',
    example: 'Medellín',
    required: false,
  })
  routeGroup?: string;

  @Column({ name: 'iscarrier', default: false })
  @ApiProperty({
    description:
      'Indica que la zona es por transportadora (dirección y teléfono obligatorios)',
    default: false,
  })
  isCarrier: boolean;

  @Column({ default: true })
  @ApiProperty({ default: true })
  active: boolean;

  @Column({ name: 'sortorder', type: 'int', default: 0 })
  @ApiProperty({ default: 0 })
  sortOrder: number;

  @ManyToOne(() => Store, (store) => store.id)
  @JoinColumn()
  store: Store;
}
