import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsBoolean,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { SortOrder } from '../../user/dto/find-users.dto';

export class FindCustomersDto {
  @ApiProperty({
    description: 'Número de página',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Número de resultados por página',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({
    description: 'Término de búsqueda (nombre, email, teléfono)',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filtrar por ciudad',
    required: false,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'Puntos de lealtad mínimos',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  minLoyaltyPoints?: number;

  @ApiProperty({
    description: 'Puntos de lealtad máximos',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  maxLoyaltyPoints?: number;

  @ApiProperty({
    description: 'Total gastado mínimo',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  minTotalSpent?: number;

  @ApiProperty({
    description: 'Total gastado máximo',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  maxTotalSpent?: number;

  @ApiProperty({
    description: 'Filtrar por estado activo/inactivo',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Campo por el cual ordenar',
    example: 'createdAt',
    required: false,
    enum: [
      'name',
      'email',
      'totalSpent',
      'totalOrders',
      'loyaltyPoints',
      'createdAt',
    ],
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'name',
    'email',
    'totalSpent',
    'totalOrders',
    'loyaltyPoints',
    'createdAt',
  ])
  sortBy?: string;

  @ApiProperty({
    description: 'Orden de clasificación',
    example: SortOrder.DESC,
    required: false,
    enum: SortOrder,
  })
  @IsOptional()
  @IsString()
  @IsIn([SortOrder.ASC, SortOrder.DESC])
  sortOrder?: SortOrder;

  @ApiProperty({
    description: 'Fecha de inicio para filtrar por fecha de registro',
    required: false,
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({
    description: 'Fecha de fin para filtrar por fecha de registro',
    required: false,
  })
  @IsOptional()
  @IsString()
  endDate?: string;
}
