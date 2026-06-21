import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateOrderDto } from './create-order.dto';
import { OrderStatus, PaymentMethod } from '../entities/order.entity';
import { IsOptional, IsEnum, IsString, IsNumber } from 'class-validator';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @ApiPropertyOptional({
    description: 'Nuevo estado de la orden',
    enum: OrderStatus,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Notas de la orden' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Método de pago', enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Días de crédito si aplica',
    example: 30,
  })
  @IsOptional()
  @IsNumber()
  creditDays?: number;

  @ApiPropertyOptional({ description: 'ID de factura' })
  @IsOptional()
  @IsString()
  invoiceId?: string;

  @ApiPropertyOptional({ description: 'URL del PDF de factura' })
  @IsOptional()
  @IsString()
  invoicePdfUrl?: string;
}
