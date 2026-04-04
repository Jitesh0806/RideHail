import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentMethod {
  CARD = 'card',
  WALLET = 'wallet',
  CASH = 'cash',
}

@Entity('payments')
@Index(['status'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  rideId: string;

  @Column()
  riderId: string;

  @Column({ nullable: true })
  driverId: string;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  driverAmount: number;  // After platform commission

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  platformFee: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.CARD })
  method: PaymentMethod;

  // Stripe fields
  @Column({ nullable: true })
  stripePaymentIntentId: string;

  @Column({ nullable: true })
  stripeChargeId: string;

  @Column({ nullable: true })
  stripeRefundId: string;

  @Column({ nullable: true })
  stripeTransferId: string;

  @Column({ nullable: true })
  failureReason: string;

  @Column({ nullable: true })
  refundedAt: Date;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  refundAmount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
