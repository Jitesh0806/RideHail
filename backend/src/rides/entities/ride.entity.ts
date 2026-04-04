import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Driver } from '../../drivers/entities/driver.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { Rating } from '../../ratings/entities/rating.entity';
import { VehicleType } from '../../drivers/entities/driver.entity';

export enum RideStatus {
  SEARCHING = 'searching',       // Looking for driver
  DRIVER_ASSIGNED = 'driver_assigned',
  DRIVER_EN_ROUTE = 'driver_en_route',  // Driver heading to pickup
  DRIVER_ARRIVED = 'driver_arrived',    // Driver at pickup
  IN_PROGRESS = 'in_progress',          // Trip started
  COMPLETED = 'completed',
  CANCELLED_BY_RIDER = 'cancelled_by_rider',
  CANCELLED_BY_DRIVER = 'cancelled_by_driver',
  NO_DRIVER_FOUND = 'no_driver_found',
}

export enum CancellationReason {
  RIDER_CHANGED_MIND = 'rider_changed_mind',
  DRIVER_NO_SHOW = 'driver_no_show',
  DRIVER_CANCELLED = 'driver_cancelled',
  EMERGENCY = 'emergency',
  WRONG_LOCATION = 'wrong_location',
  OTHER = 'other',
}

@Entity('rides')
@Index(['status'])
@Index(['createdAt'])
export class Ride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Participants
  @ManyToOne(() => User, (user) => user.rides)
  rider: User;

  @Column()
  riderId: string;

  @ManyToOne(() => Driver, (driver) => driver.rides, { nullable: true })
  driver: Driver;

  @Column({ nullable: true })
  driverId: string;

  // Pickup location
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  pickupLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  pickupLongitude: number;

  @Column()
  pickupAddress: string;

  // Destination
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  destinationLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  destinationLongitude: number;

  @Column()
  destinationAddress: string;

  // Ride details
  @Column({ type: 'enum', enum: RideStatus, default: RideStatus.SEARCHING })
  status: RideStatus;

  @Column({
    type: 'enum',
    enum: VehicleType,
    default: VehicleType.STANDARD,
  })
  requestedVehicleType: VehicleType;

  // Fare
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  estimatedFare: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  finalFare: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  surgeMultiplier: number;

  // Distance & duration
  @Column({ type: 'decimal', precision: 8, scale: 3, nullable: true })
  estimatedDistanceKm: number;

  @Column({ type: 'decimal', precision: 8, scale: 3, nullable: true })
  actualDistanceKm: number;

  @Column({ nullable: true })
  estimatedDurationMinutes: number;

  @Column({ nullable: true })
  actualDurationMinutes: number;

  // Search radius (for driver matching)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 3 })
  currentSearchRadiusKm: number;

  // Timestamps
  @Column({ nullable: true })
  driverAssignedAt: Date;

  @Column({ nullable: true })
  driverArrivedAt: Date;

  @Column({ nullable: true })
  tripStartedAt: Date;

  @Column({ nullable: true })
  tripCompletedAt: Date;

  @Column({ nullable: true })
  cancelledAt: Date;

  @Column({ type: 'enum', enum: CancellationReason, nullable: true })
  cancellationReason: CancellationReason;

  @Column({ nullable: true })
  cancellationNote: string;

  // Special requests
  @Column({ nullable: true })
  specialRequests: string;

  @Column({ type: 'jsonb', nullable: true })
  routePolyline: any;  // Encoded route for display

  // Payment
  @OneToOne(() => Payment, { nullable: true })
  @JoinColumn()
  payment: Payment;

  @Column({ nullable: true })
  paymentId: string;

  // Rating
  @OneToOne(() => Rating, { nullable: true })
  @JoinColumn()
  rating: Rating;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
