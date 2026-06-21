import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PlanType } from '../../user/entities/subscription.entity';
import { PaymentFrequency } from '../entities/payment-source.entity';

/**
 * Suscripción SaaS con Mercado Pago PreApproval. Ya NO se piden datos de tarjeta
 * ni tokens de aceptación (los recoge la UI de Checkout de MP); solo el plan y
 * la frecuencia.
 */
export class CreateSubscriptionDto {
  @ApiProperty({ enum: PlanType })
  @IsEnum(PlanType)
  planType: PlanType;

  @ApiProperty({ enum: PaymentFrequency })
  @IsEnum(PaymentFrequency)
  frequency: PaymentFrequency;

  @ApiProperty({
    required: false,
    description: 'URL pública de retorno tras autorizar la suscripción',
  })
  @IsOptional()
  @IsString()
  backUrl?: string;
}
