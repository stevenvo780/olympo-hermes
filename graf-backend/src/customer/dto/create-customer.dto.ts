import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsDateString } from 'class-validator';
import { AtLeastOneProperty } from '../../common/validators/at-least-one-property';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Nombre del cliente',
    example: 'Juan Pérez',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Email del cliente',
    example: 'juan@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Teléfono del cliente',
    example: '+57 300 123 4567',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Número de documento del cliente',
    example: '1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiProperty({
    description: 'Dirección del cliente',
    example: 'Calle 123 #45-67',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Ciudad del cliente',
    example: 'Bogotá',
    required: false,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'Código postal del cliente',
    example: '110111',
    required: false,
  })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({
    description: 'Fecha de nacimiento del cliente',
    example: '1990-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiProperty({
    description: 'Notas adicionales sobre el cliente',
    example: 'Cliente preferencial',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'ID de la tienda a la que pertenece el cliente',
    example: 'store-123',
  })
  @IsString()
  storeId: string;

  /**
   * Validación a nivel de clase: al menos uno de email, phone o documentNumber.
   */
  @AtLeastOneProperty(['email', 'phone', 'documentNumber'], {
    message: 'Debe proporcionar al menos uno de: email, phone o documentNumber',
  })
  private _validator!: boolean;
}
