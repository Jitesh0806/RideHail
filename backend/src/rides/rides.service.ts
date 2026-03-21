import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ride, RideStatus, CancellationReason } from './entities/ride.entity';
import { Driver, DriverStatus } from '../drivers/entities/driver.entity';
import { User } from '../users/entities/user.entity';
import { DriverMatchingService } from './driver-matching.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RequestRideDto } from './dto/request-ride.dto';
import { getDistance } from 'geolib';

@Injectable()
export class RidesService {
  private readonly logger = new Logger(RidesService.name);

  constructor(
    @InjectRepository(Ride) private readonly rideRepo: Repository<Ride>,
    @InjectRepository(Driver) private readonly driverRepo: Repository<Driver>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly driverMatching: DriverMatchingService,
    private readonly notifications: NotificationsService,
  ) {}

  async requestRide(riderId: string, dto: RequestRideDto): Promise<Ride> {
    // Check no active ride
    const activeRide = await this.rideRepo.findOne({
      where: {
        riderId,
        status: RideStatus.SEARCHING,
      },
    });
    if (activeRide) {
      throw new BadRequestException('You already have an active ride request');
    }

    // Calculate distance & estimate fare
    const distanceM = getDistance(
      { latitude: dto.pickupLatitude, longitude: dto.pickupLongitude },
      { latitude: dto.destinationLatitude, longitude: dto.destinationLongitude },
    );
    const distanceKm = distanceM / 1000;
    const estimatedFare = this.driverMatching.calculateFare(
      distanceKm,
      dto.vehicleType,
    );

    const ride = this.rideRepo.create({
      riderId,
      pickupLatitude: dto.pickupLatitude,
      pickupLongitude: dto.pickupLongitude,
      pickupAddress: dto.pickupAddress,
      destinationLatitude: dto.destinationLatitude,
      destinationLongitude: dto.destinationLongitude,
      destinationAddress: dto.destinationAddress,
      requestedVehicleType: dto.vehicleType,
      estimatedDistanceKm: distanceKm,
      estimatedFare,
      status: RideStatus.SEARCHING,
      currentSearchRadiusKm: 3,
      specialRequests: dto.specialRequests,
    });

    await this.rideRepo.save(ride);

    // Start driver search asynchronously
    this.searchForDriver(ride.id);

    return ride;
  }

  private async searchForDriver(rideId: string): Promise<void> {
    const ride = await this.rideRepo.findOne({ where: { id: rideId } });
    if (!ride || ride.status !== RideStatus.SEARCHING) return;

    const nearby = await this.driverMatching.findNearbyDrivers(
      ride.pickupLatitude,
      ride.pickupLongitude,
      ride.requestedVehicleType,
      ride.currentSearchRadiusKm,
    );

    if (nearby.length === 0) {
      const nextRadius = this.driverMatching.getNextSearchRadius(
        ride.currentSearchRadiusKm,
      );
      if (nextRadius) {
        this.logger.log(`Expanding search radius to ${nextRadius}km for ride ${rideId}`);
        await this.rideRepo.update(rideId, { currentSearchRadiusKm: nextRadius });
        setTimeout(() => this.searchForDriver(rideId), 30000); // retry in 30s
      } else {
        await this.rideRepo.update(rideId, { status: RideStatus.NO_DRIVER_FOUND });
        // Notify rider
        const rider = await this.userRepo.findOne({ where: { id: ride.riderId } });
        if (rider?.fcmToken) {
          await this.notifications.sendPushNotification(
            rider.fcmToken,
            'No drivers available',
            'Sorry, no drivers are available nearby. Please try again.',
          );
        }
      }
      return;
    }

    // Send request to closest available driver
    const { driver } = nearby[0];
    const driverUser = await this.userRepo.findOne({ where: { id: driver.userId } });
    if (driverUser?.fcmToken) {
      await this.notifications.sendPushNotification(
        driverUser.fcmToken,
        'New Ride Request!',
        `Pickup: ${ride.pickupAddress} → ${ride.destinationAddress}`,
        { rideId: ride.id },
      );
    }
  }

  async driverAcceptRide(driverId: string, rideId: string): Promise<Ride> {
    const driver = await this.driverRepo.findOne({ where: { userId: driverId } });
    if (!driver) throw new NotFoundException('Driver not found');

    const ride = await this.rideRepo.findOne({ where: { id: rideId } });
    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.status !== RideStatus.SEARCHING) {
      throw new BadRequestException('Ride is no longer available');
    }

    ride.driverId = driver.id;
    ride.status = RideStatus.DRIVER_ASSIGNED;
    ride.driverAssignedAt = new Date();
    await this.rideRepo.save(ride);

    await this.driverRepo.update(driver.id, { status: DriverStatus.ON_RIDE });

    // Notify rider
    const rider = await this.userRepo.findOne({ where: { id: ride.riderId } });
    if (rider?.fcmToken) {
      await this.notifications.sendPushNotification(
        rider.fcmToken,
        'Driver Accepted!',
        `${driver.user?.firstName || 'Your driver'} is on the way`,
        { rideId, driverId: driver.id },
      );
    }

    return this.rideRepo.findOne({
      where: { id: rideId },
      relations: ['driver', 'driver.user', 'rider'],
    });
  }

  async driverRejectRide(driverId: string, rideId: string): Promise<void> {
    // Continue searching with next available driver
    setTimeout(() => this.searchForDriver(rideId), 5000);
  }

  async updateRideStatus(
    userId: string,
    rideId: string,
    status: RideStatus,
    isDriver: boolean,
  ): Promise<Ride> {
    const ride = await this.rideRepo.findOne({
      where: { id: rideId },
      relations: ['driver', 'rider'],
    });
    if (!ride) throw new NotFoundException('Ride not found');

    // Validate status transitions
    const validTransitions: Partial<Record<RideStatus, RideStatus[]>> = {
      [RideStatus.DRIVER_ASSIGNED]: [RideStatus.DRIVER_EN_ROUTE],
      [RideStatus.DRIVER_EN_ROUTE]: [RideStatus.DRIVER_ARRIVED],
      [RideStatus.DRIVER_ARRIVED]: [RideStatus.IN_PROGRESS],
      [RideStatus.IN_PROGRESS]: [RideStatus.COMPLETED],
    };

    const allowed = validTransitions[ride.status];
    if (!allowed?.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${ride.status} to ${status}`);
    }

    const updates: Partial<Ride> = { status };

    if (status === RideStatus.DRIVER_ARRIVED) {
      updates.driverArrivedAt = new Date();
    } else if (status === RideStatus.IN_PROGRESS) {
      updates.tripStartedAt = new Date();
    } else if (status === RideStatus.COMPLETED) {
      updates.tripCompletedAt = new Date();
      const startTime = ride.tripStartedAt || new Date();
      updates.actualDurationMinutes = Math.round(
        (Date.now() - startTime.getTime()) / 60000,
      );
    }

    await this.rideRepo.update(rideId, updates);

    // Notify the other party
    const notifyUserId = isDriver ? ride.riderId : ride.driverId;
    // notifications handled by gateway via WebSocket primarily

    return this.rideRepo.findOne({
      where: { id: rideId },
      relations: ['driver', 'driver.user', 'rider'],
    });
  }

  async cancelRide(
    userId: string,
    rideId: string,
    reason: CancellationReason,
    note?: string,
    isDriver = false,
  ): Promise<Ride> {
    const ride = await this.rideRepo.findOne({ where: { id: rideId } });
    if (!ride) throw new NotFoundException('Ride not found');

    const cancellableStatuses = [
      RideStatus.SEARCHING,
      RideStatus.DRIVER_ASSIGNED,
      RideStatus.DRIVER_EN_ROUTE,
      RideStatus.DRIVER_ARRIVED,
    ];
    if (!cancellableStatuses.includes(ride.status)) {
      throw new BadRequestException('Ride cannot be cancelled at this stage');
    }

    const status = isDriver
      ? RideStatus.CANCELLED_BY_DRIVER
      : RideStatus.CANCELLED_BY_RIDER;

    await this.rideRepo.update(rideId, {
      status,
      cancellationReason: reason,
      cancellationNote: note,
      cancelledAt: new Date(),
    });

    // Release driver
    if (ride.driverId) {
      await this.driverRepo.update(ride.driverId, { status: DriverStatus.ONLINE });
    }

    return this.rideRepo.findOne({ where: { id: rideId } });
  }

  async getRideHistory(userId: string, isDriver = false) {
    const query = this.rideRepo
      .createQueryBuilder('ride')
      .leftJoinAndSelect('ride.driver', 'driver')
      .leftJoinAndSelect('driver.user', 'driverUser')
      .leftJoinAndSelect('ride.rider', 'rider')
      .leftJoinAndSelect('ride.payment', 'payment')
      .leftJoinAndSelect('ride.rating', 'rating')
      .orderBy('ride.createdAt', 'DESC');

    if (isDriver) {
      query.where('driver.userId = :userId', { userId });
    } else {
      query.where('ride.riderId = :userId', { userId });
    }

    return query.getMany();
  }

  async getRideById(rideId: string): Promise<Ride> {
    const ride = await this.rideRepo.findOne({
      where: { id: rideId },
      relations: ['driver', 'driver.user', 'rider', 'payment', 'rating'],
    });
    if (!ride) throw new NotFoundException('Ride not found');
    return ride;
  }
}
