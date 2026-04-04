import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User, UserStatus } from '../users/entities/user.entity';
import { Driver, DriverStatus } from '../drivers/entities/driver.entity';
import { Ride, RideStatus } from '../rides/entities/ride.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { DriversService } from '../drivers/drivers.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Driver) private readonly driverRepo: Repository<Driver>,
    @InjectRepository(Ride) private readonly rideRepo: Repository<Ride>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    private readonly driversService: DriversService,
  ) {}

  // ─── Dashboard Summary ────────────────────────────────────────────────────

  async getDashboardStats() {
    const [
      totalUsers,
      totalDrivers,
      activeDrivers,
      totalRides,
      activeRides,
      todayRides,
      todayRevenue,
    ] = await Promise.all([
      this.userRepo.count({ where: { role: 'rider' as any } }),
      this.driverRepo.count(),
      this.driverRepo.count({ where: { status: DriverStatus.ONLINE } }),
      this.rideRepo.count(),
      this.rideRepo.count({
        where: [
          { status: RideStatus.SEARCHING },
          { status: RideStatus.DRIVER_EN_ROUTE },
          { status: RideStatus.IN_PROGRESS },
        ],
      }),
      this.getTodayRideCount(),
      this.getTodayRevenue(),
    ]);

    return {
      totalUsers,
      totalDrivers,
      activeDrivers,
      totalRides,
      activeRides,
      todayRides,
      todayRevenue,
    };
  }

  private async getTodayRideCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.rideRepo.count({
      where: { createdAt: Between(today, new Date()) },
    });
  }

  private async getTodayRevenue(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const payments = await this.paymentRepo.find({
      where: {
        status: PaymentStatus.COMPLETED,
        createdAt: Between(today, new Date()),
      },
    });
    return payments.reduce((sum, p) => sum + Number(p.platformFee), 0);
  }

  // ─── Active Rides Monitoring ──────────────────────────────────────────────

  async getActiveRides() {
    return this.rideRepo.find({
      where: [
        { status: RideStatus.SEARCHING },
        { status: RideStatus.DRIVER_ASSIGNED },
        { status: RideStatus.DRIVER_EN_ROUTE },
        { status: RideStatus.DRIVER_ARRIVED },
        { status: RideStatus.IN_PROGRESS },
      ],
      relations: ['rider', 'driver', 'driver.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async adminCancelRide(rideId: string, reason: string): Promise<Ride> {
    const ride = await this.rideRepo.findOne({ where: { id: rideId } });
    if (!ride) throw new NotFoundException('Ride not found');

    await this.rideRepo.update(rideId, {
      status: RideStatus.CANCELLED_BY_DRIVER,
      cancellationNote: `Admin cancelled: ${reason}`,
      cancelledAt: new Date(),
    });

    if (ride.driverId) {
      await this.driverRepo.update(ride.driverId, { status: DriverStatus.ONLINE });
    }

    return this.rideRepo.findOne({ where: { id: rideId } });
  }

  // ─── User Management ─────────────────────────────────────────────────────

  async getAllUsers(page = 1, limit = 20, search?: string) {
    const query = this.userRepo.createQueryBuilder('user').orderBy('user.createdAt', 'DESC');

    if (search) {
      query.where(
        'user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search',
        { search: `%${search}%` },
      );
    }

    const [users, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { users, total, page, limit };
  }

  async suspendUser(userId: string, reason: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    await this.userRepo.update(userId, { status: UserStatus.SUSPENDED });
    return this.userRepo.findOne({ where: { id: userId } });
  }

  async activateUser(userId: string): Promise<User> {
    await this.userRepo.update(userId, { status: UserStatus.ACTIVE });
    return this.userRepo.findOne({ where: { id: userId } });
  }

  // ─── Driver Management ────────────────────────────────────────────────────

  async getPendingDrivers() {
    return this.driversService.getPendingVerification();
  }

  async approveDriver(driverId: string, adminId: string) {
    return this.driversService.approveDriver(driverId, adminId);
  }

  async rejectDriver(driverId: string, adminId: string, notes: string) {
    return this.driversService.rejectDriver(driverId, adminId, notes);
  }

  async suspendDriver(driverId: string): Promise<Driver> {
    const driver = await this.driverRepo.findOne({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('Driver not found');
    await this.driverRepo.update(driverId, { status: DriverStatus.SUSPENDED });
    await this.userRepo.update(driver.userId, { status: UserStatus.SUSPENDED });
    return this.driverRepo.findOne({ where: { id: driverId }, relations: ['user'] });
  }

  // ─── Analytics ────────────────────────────────────────────────────────────

  async getAnalytics(startDate: Date, endDate: Date) {
    const rides = await this.rideRepo.find({
      where: { createdAt: Between(startDate, endDate) },
    });

    const completed = rides.filter((r) => r.status === RideStatus.COMPLETED);
    const cancelled = rides.filter(
      (r) =>
        r.status === RideStatus.CANCELLED_BY_DRIVER ||
        r.status === RideStatus.CANCELLED_BY_RIDER,
    );

    const payments = await this.paymentRepo.find({
      where: {
        status: PaymentStatus.COMPLETED,
        createdAt: Between(startDate, endDate),
      },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const platformRevenue = payments.reduce((sum, p) => sum + Number(p.platformFee), 0);

    // Peak hour analysis
    const hourCounts: Record<number, number> = {};
    rides.forEach((r) => {
      const hour = new Date(r.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return {
      period: { startDate, endDate },
      totalRides: rides.length,
      completedRides: completed.length,
      cancelledRides: cancelled.length,
      completionRate: rides.length > 0 ? (completed.length / rides.length) * 100 : 0,
      totalRevenue,
      platformRevenue,
      averageFare: completed.length > 0
        ? completed.reduce((s, r) => s + Number(r.finalFare || r.estimatedFare || 0), 0) / completed.length
        : 0,
      peakHours: hourCounts,
    };
  }

  async getDriverDistribution() {
    const drivers = await this.driverRepo.find({
      where: { status: DriverStatus.ONLINE },
      select: ['id', 'currentLatitude', 'currentLongitude', 'vehicleType', 'status'],
    });
    return drivers.map((d) => ({
      driverId: d.id,
      latitude: d.currentLatitude,
      longitude: d.currentLongitude,
      vehicleType: d.vehicleType,
    }));
  }
}
