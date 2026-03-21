import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Payment, PaymentStatus, PaymentMethod } from './entities/payment.entity';

const PLATFORM_COMMISSION = 0.20; // 20% platform fee

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: Stripe;

  constructor(
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    private readonly config: ConfigService,
  ) {
    this.stripe = new Stripe(config.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16',
    });
  }

  async createPaymentIntent(
    rideId: string,
    riderId: string,
    driverId: string,
    amount: number,
    currency: string = 'usd',
  ): Promise<{ clientSecret: string; paymentId: string }> {
    const platformFee = Math.round(amount * PLATFORM_COMMISSION * 100);
    const driverAmount = amount - amount * PLATFORM_COMMISSION;

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency,
      metadata: { rideId, riderId, driverId },
    });

    const payment = this.paymentRepo.create({
      rideId,
      riderId,
      driverId,
      amount,
      driverAmount,
      platformFee: amount * PLATFORM_COMMISSION,
      currency,
      status: PaymentStatus.PENDING,
      method: PaymentMethod.CARD,
      stripePaymentIntentId: paymentIntent.id,
    });

    await this.paymentRepo.save(payment);

    return { clientSecret: paymentIntent.client_secret, paymentId: payment.id };
  }

  async confirmPayment(paymentIntentId: string): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({
      where: { stripePaymentIntentId: paymentIntentId },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    await this.paymentRepo.update(payment.id, { status: PaymentStatus.COMPLETED });

    // Transfer to driver (Stripe Connect)
    if (payment.stripePaymentIntentId) {
      try {
        const transfer = await this.stripe.transfers.create({
          amount: Math.round(payment.driverAmount * 100),
          currency: payment.currency,
          source_transaction: paymentIntentId,
          destination: 'driver_stripe_connect_account_id', // Retrieved from driver profile
        });
        await this.paymentRepo.update(payment.id, {
          stripeTransferId: transfer.id,
        });
      } catch (err) {
        this.logger.error('Driver transfer failed:', err.message);
      }
    }

    return this.paymentRepo.findOne({ where: { id: payment.id } });
  }

  async processWebhook(payload: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      this.logger.error('Stripe webhook validation failed:', err.message);
      throw err;
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.confirmPayment((event.data.object as Stripe.PaymentIntent).id);
        break;
      case 'payment_intent.payment_failed':
        const failed = event.data.object as Stripe.PaymentIntent;
        await this.paymentRepo.update(
          { stripePaymentIntentId: failed.id },
          {
            status: PaymentStatus.FAILED,
            failureReason: failed.last_payment_error?.message,
          },
        );
        break;
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');

    const refund = await this.stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });

    await this.paymentRepo.update(paymentId, {
      status: amount ? PaymentStatus.PARTIALLY_REFUNDED : PaymentStatus.REFUNDED,
      stripeRefundId: refund.id,
      refundedAt: new Date(),
      refundAmount: amount || payment.amount,
    });

    return this.paymentRepo.findOne({ where: { id: paymentId } });
  }

  async getPaymentsByRider(riderId: string): Promise<Payment[]> {
    return this.paymentRepo.find({
      where: { riderId },
      order: { createdAt: 'DESC' },
    });
  }

  async getDriverEarnings(
    driverId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ payments: Payment[]; totalEarnings: number }> {
    const query = this.paymentRepo
      .createQueryBuilder('payment')
      .where('payment.driverId = :driverId', { driverId })
      .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED });

    if (startDate) query.andWhere('payment.createdAt >= :startDate', { startDate });
    if (endDate) query.andWhere('payment.createdAt <= :endDate', { endDate });

    const payments = await query.orderBy('payment.createdAt', 'DESC').getMany();
    const totalEarnings = payments.reduce((sum, p) => sum + Number(p.driverAmount), 0);

    return { payments, totalEarnings };
  }
}
