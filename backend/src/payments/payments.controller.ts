import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Headers,
  RawBodyRequest,
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';
import { Public } from '../common/decorators/public.decorator';
import { IsString, IsNumber, IsOptional } from 'class-validator';

class CreatePaymentIntentDto {
  @IsString() rideId: string;
  @IsString() driverId: string;
  @IsNumber() amount: number;
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('intent')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create Stripe payment intent' })
  async createPaymentIntent(@Request() req, @Body() dto: CreatePaymentIntentDto) {
    return this.paymentsService.createPaymentIntent(
      dto.rideId,
      req.user.id,
      dto.driverId,
      dto.amount,
    );
  }

  @Get('history')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get payment history' })
  async getHistory(@Request() req) {
    return this.paymentsService.getPaymentsByRider(req.user.id);
  }

  @Get('earnings')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: "Driver: Get earnings" })
  async getEarnings(@Request() req, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.paymentsService.getDriverEarnings(
      req.user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Post(':id/refund')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Refund a payment' })
  async refund(@Param('id') id: string, @Body() body: { amount?: number }) {
    return this.paymentsService.refundPayment(id, body.amount);
  }

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    await this.paymentsService.processWebhook(req.rawBody, signature);
    return { received: true };
  }
}
