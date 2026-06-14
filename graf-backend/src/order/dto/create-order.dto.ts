import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsObject,
  IsEnum,
} from 'class-validator';
import { OrderItem } from '../entities/order-item.entity';
import { Store } from '@/store/entities/store.entity';
import { ShippingAddress } from '@/profile/entities/profile.entity';
import {
  PaymentMethod,
  OrderStatus,
  DiscountType,
} from '../entities/order.entity';

export class CreateOrderDto {
  @ApiProperty({ description: 'Items de la orden' })
  @IsArray()
  items: Partial<OrderItem>[];

  @ApiProperty({ description: 'ID de la store asociada a la orden' })
  @IsString()
  store: Store;

  @ApiProperty({
    description: 'Dirección de envío del comprador',
    required: false,
  })
  @IsOptional()
  @IsObject()
  shippingAddress?: ShippingAddress;

  @ApiProperty({
    description: 'Método de pago',
    required: false,
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiProperty({
    description: 'Días de crédito (si el método es crédito)',
    required: false,
    example: 30,
  })
  @IsOptional()
  @IsNumber()
  creditDays?: number;

  @ApiProperty({ description: 'Notas del pedido', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Estado inicial de la orden',
    required: false,
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiProperty({
    description: 'Respuestas a las preguntas personalizadas de la tienda',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        question: { type: 'string' },
        answer: { type: 'string' },
      },
    },
    example: [
      {
        question: '¿Cuál es su requerimiento?',
        answer: 'Necesito envío urgente',
      },
    ],
  })
  @IsArray()
  @IsObject({ each: true })
  customAnswers: { question: string; answer: string }[];

  @ApiProperty({ description: 'ID de la zona de entrega', required: false })
  @IsOptional()
  @IsNumber()
  deliveryZoneId?: number;

  @ApiProperty({
    description: 'IDs de los impuestos a aplicar',
    required: false,
    type: [Number],
    example: [1, 2],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  taxIds?: number[];

  @ApiProperty({
    description:
      'ID del usuario para el cual se crea la orden (solo para admins)',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: 'ID del customer para asociar a la orden (solo para admins)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  customerId?: number;

  @ApiProperty({
    description: 'URLs de documentos adjuntos a la orden',
    required: false,
    type: [String],
    example: ['https://storage.firebase.com/order-doc-1.pdf'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];

  @ApiProperty({
    description: 'Tipo de descuento a aplicar',
    required: false,
    enum: DiscountType,
  })
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @ApiProperty({
    description: 'Valor del descuento (porcentaje 0-100 o cantidad fija)',
    required: false,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  discountValue?: number;

  @ApiProperty({
    description: 'Nombre del comprador',
    required: false,
    example: 'Juan Pérez',
  })
  @IsOptional()
  @IsString()
  buyerName?: string;

  @ApiProperty({
    description: 'Teléfono del comprador',
    required: false,
    example: '+57 300 123 4567',
  })
  @IsOptional()
  @IsString()
  buyerPhone?: string;

  @ApiProperty({
    description: 'Correo del comprador',
    required: false,
    example: 'comprador@ejemplo.com',
  })
  @IsOptional()
  @IsString()
  buyerEmail?: string;

  @ApiProperty({
    description: 'Documento del comprador',
    required: false,
    example: '1234567890',
  })
  @IsOptional()
  @IsString()
  buyerDocument?: string;
}
