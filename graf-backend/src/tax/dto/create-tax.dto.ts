import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaxDto {
  @IsString()
  @ApiProperty({ description: 'Tax name' })
  name: string;

  @IsNumber()
  @ApiProperty({ description: 'Tax rate (percentage)' })
  rate: number;
}
