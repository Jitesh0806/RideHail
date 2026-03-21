import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Ride } from '../../rides/entities/ride.entity';

export enum DriverStatus {
  OFFLINE = 'offline',
  ONLINE = 'online',
  ON_RIDE = 'on_ride',
  SUSPENDED = 'suspended',
}

export enum VerificationStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum VehicleType {
  ECONOMY = 'economy',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  XL = 'xl',
}

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { eager: true })
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  // Vehicle info
  @Column()
  vehicleMake: string;

  @Column()
  vehicleModel: string;

  @Column()
  vehicleYear: number;

  @Column()
  vehicleColor: string;

  @Column({ unique: true })
  vehiclePlate: string;

  @Column({ type: 'enum', enum: VehicleType, default: VehicleType.STANDARD })
  vehicleType: VehicleType;

  @Column({ default: 4 })
  vehicleCapacity: number;

  // License & documents
  @Column({ unique: true })
  licenseNumber: string;

  @Column()
  licenseExpiry: Date;

  @Column({ nullable: true })
  licenseImageUrl: string;

  @Column({ nullable: true })
  vehicleInsuranceUrl: string;

  @Column({ nullable: true })
  vehicleRegistrationUrl: string;

  // Status
  @Column({ type: 'enum', enum: DriverStatus, default: DriverStatus.OFFLINE })
  status: DriverStatus;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  verificationStatus: VerificationStatus;

  @Column({ nullable: true })
  verificationNotes: string;

  @Column({ nullable: true })
  verifiedAt: Date;

  @Column({ nullable: true })
  verifiedByAdminId: string;

  // Location (updated in real-time)
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  @Index()
  currentLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  @Index()
  currentLongitude: number;

  @Column({ nullable: true })
  locationUpdatedAt: Date;

  // Earnings
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEarnings: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  pendingEarnings: number;

  @Column({ default: 0 })
  totalTrips: number;

  @Column({ default: 0 })
  acceptedRides: number;

  @Column({ default: 0 })
  rejectedRides: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  // Bank details for payouts
  @Column({ nullable: true })
  bankAccountNumber: string;

  @Column({ nullable: true })
  bankRoutingNumber: string;

  @Column({ nullable: true })
  stripeConnectAccountId: string;

  @OneToMany(() => Ride, (ride) => ride.driver)
  rides: Ride[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get acceptanceRate(): number {
    const total = this.acceptedRides + this.rejectedRides;
    return total > 0 ? Math.round((this.acceptedRides / total) * 100) : 0;
  }
}
