import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OptionalFirebaseAuthGuard } from 'src/auth/optional-firebase-auth.guard';
import {
  CustomPaymentsService,
  WompiWebhookPayload,
} from './custom-payments.service';
import { CreateOrderPaymentDto } from './dto/create-order-payment.dto';
import { RequestWithUser } from '../auth/types';

@ApiTags('payments')
@Controller('payments/:storeId')
export class CustomPaymentsController {
  constructor(private readonly service: CustomPaymentsService) {}

  @Post('order-and-pay')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create order and generate payment link' })
  @UseGuards(OptionalFirebaseAuthGuard)
  async orderAndPay(
    @Param('storeId') storeId: string,
    @Req() req: RequestWithUser,
    @Body() dto: CreateOrderPaymentDto,
  ) {
    return this.service.orderAndPay(storeId, req.user, dto);
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Webhook to process payment events' })
  async webhook(
    @Param('storeId') storeId: string,
    @Body() payload: WompiWebhookPayload,
  ) {
    return this.service.handleWebhook(storeId, payload);
  }
}
