import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEmailDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'New email address for the user',
    example: 'newemail@example.com',
  })
  email: string;
}
