import { IsString, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DiscountType } from '../entities/discount.entity';

export class CreateDiscountDto {
  @IsEnum(DiscountType)
  @ApiProperty({
    description: 'Discount type (fixed or percentage)',
    enum: DiscountType,
  })
  discountType: DiscountType;

  @IsString()
  @ApiProperty({ description: 'Discount name' })
  name: string;

  @IsNumber()
  @ApiProperty({ description: 'Discount value' })
  discountValue: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ description: 'Product ID', required: false })
  productId?: number;
}
