import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateZoneDto {
  @ApiProperty({ example: 'Medellín Norte' })
  @IsString()
  zone: string;

  @ApiProperty({ required: false, example: 'med-norte' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ required: false, example: 'Medellín' })
  @IsOptional()
  @IsString()
  routeGroup?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isCarrier?: boolean;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  estimatedTime?: string;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  storeId?: string;
}

export class UpdateZoneDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  zone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  routeGroup?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isCarrier?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  estimatedTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
