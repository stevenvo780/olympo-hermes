import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDiscountDto {
  @IsOptional()
  @IsString()
  @IsIn(['fixed', 'percentage'])
  @ApiPropertyOptional({
    description: 'Discount type (fixed or percentage)',
  })
  discountType?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Discount name' })
  name?: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Discount value' })
  discountValue?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Product ID', required: false })
  productId?: number;
}
