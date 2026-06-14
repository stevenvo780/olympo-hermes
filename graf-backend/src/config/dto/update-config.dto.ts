import { PartialType } from '@nestjs/swagger';
import { CreateConfigDto } from './create-config.dto';

export interface Infraction {
  name: string;
  value: string;
  points: number;
  emoji: string;
  description: string;
}

export class UpdateConfigDto extends PartialType(CreateConfigDto) {
  enablePaymentLinks?: boolean;
}
