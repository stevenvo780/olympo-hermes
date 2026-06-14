import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCredentialsDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Wompi public key' })
  publicKey?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Wompi private key', writeOnly: true })
  privateKey?: string;
}
