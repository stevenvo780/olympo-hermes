import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DistOrderStatus } from '../../order/entities/order.entity';

export class OrderItemInputDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  productId: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ required: false, description: 'Precio unitario override' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}

export class CreateDistOrderDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  sellerId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  customerId: number;

  @ApiProperty({ required: false, description: 'Sede de entrega elegida' })
  @IsOptional()
  @IsInt()
  customerAddressId?: number;

  @ApiProperty({ type: [OrderItemInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    required: false,
    description: 'Teléfono de contacto (obligatorio si la zona es transportadora)',
  })
  @IsOptional()
  @IsString()
  buyerPhone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  storeId?: string;
}

export class UpdateOrderItemsDto {
  @ApiProperty({ type: [OrderItemInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  buyerPhone?: string;
}

export class TransitionOrderDto {
  @ApiProperty({ enum: DistOrderStatus })
  @IsEnum(DistOrderStatus)
  to: DistOrderStatus;

  @ApiProperty({ required: false, description: 'Día asignado al enrutar' })
  @IsOptional()
  @IsString()
  routeDate?: string;
}

export class AssignRouteDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  orderIds: number[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  routeDate?: string;
}

export class SetRouteDateDto {
  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Día de ruta/despacho (YYYY-MM-DD). null para limpiar.',
  })
  @IsOptional()
  @IsString()
  routeDate?: string | null;
}
