import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCredentialsDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Wompi public key' })
  publicKey: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Wompi private key', writeOnly: true })
  privateKey: string;
}
