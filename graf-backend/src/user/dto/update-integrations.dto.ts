import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, IsEmail } from 'class-validator';

export class SigoCredentialsDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'SIGO API Key',
    example: 'your-sigo-api-key-here',
  })
  apiKey?: string;

  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional({
    description: 'SIGO User Email',
    example: 'user@company.com',
  })
  email?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'SIGO Password',
    example: 'your-secure-password',
  })
  password?: string;

  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({
    description: 'SIGO API URL',
    example: 'https://api.siigo.com',
    default: 'https://api.siigo.com',
  })
  apiUrl?: string;
}

export class UpdateIntegrationsDto {
  @IsOptional()
  @ApiPropertyOptional({
    description: 'SIGO Integration Credentials',
    type: SigoCredentialsDto,
  })
  sigo?: SigoCredentialsDto;
}
