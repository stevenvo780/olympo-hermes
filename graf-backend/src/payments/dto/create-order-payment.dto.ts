import { ApiProperty } from '@nestjs/swagger';
import { CreateOrderDto } from '../../order/dto/create-order.dto';

export class CreateOrderPaymentDto {
  @ApiProperty({ description: 'Order data' })
  order: CreateOrderDto;

  @ApiProperty({
    description: 'Redirect (back) URL after the Mercado Pago checkout',
    example: 'https://frontend.app/order-success',
  })
  redirectUrl: string;
}
