import { ApiProperty } from '@nestjs/swagger';
import { CreateOrderDto } from '../../order/dto/create-order.dto';

export class CreateOrderPaymentDto {
  @ApiProperty({ description: 'Order data' })
  order: CreateOrderDto;

  @ApiProperty({
    description: 'Redirect URL after payment',
    example: 'https://frontend.app/payment-summary',
  })
  redirectUrl: string;
}
