import { IsArray, ValidateNested, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AtLeastOneProperty } from '../../common/validators/at-least-one-property';

export class CustomerExcelRowDto {
  @ApiProperty({ description: 'Email del cliente', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Nombre del cliente', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Teléfono del cliente', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Documento del cliente', required: false })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiProperty({ description: 'Dirección del cliente', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Ciudad del cliente', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'Código postal', required: false })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({
    description: 'Acción: create, update, delete',
    default: 'update',
    required: false,
  })
  @IsOptional()
  @IsString()
  action?: 'create' | 'update' | 'delete';

  @AtLeastOneProperty(['email', 'phone', 'documentNumber'], {
    message: 'Cada fila debe incluir al menos: email, phone o documentNumber',
  })
  private _validator!: boolean;
}

export class ImportCustomerExcelDto {
  @ApiProperty({
    type: [CustomerExcelRowDto],
    description: 'Filas de clientes',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerExcelRowDto)
  rows: CustomerExcelRowDto[];
}
