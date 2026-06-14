import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  Min,
  IsOptional,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateDeliveryZoneDto {
  @IsString()
  @ApiProperty({
    description: 'Nombre de la zona de entrega',
    example: 'Centro',
  })
  zone: string;

  @IsNumber()
  @Min(0)
  @ApiProperty({
    description: 'Precio de envío para la zona',
    example: 5.0,
  })
  price: number;

  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === 0 || value === '' ? null : Number(value),
  )
  @ValidateIf((_, value) => value !== null)
  @IsNumber()
  @Min(0)
  @ApiProperty({
    description:
      'Monto mínimo del pedido para obtener envío gratis. Si no se especifica o es null, no aplica envío gratis.',
    example: 50000,
    required: false,
  })
  freeShippingThreshold?: number | null;

  @IsString()
  @ApiProperty({
    description: 'Tiempo estimado de entrega',
    example: '30-45 min',
  })
  estimatedTime: string;
}
