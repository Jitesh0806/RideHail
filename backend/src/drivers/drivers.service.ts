import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver, DriverStatus, VerificationStatus } from './entities/driver.entity';
import { User } from '../users/entities/user.entity';
import { StorageService } from '../locations/storage.service';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver) private readonly driverRepo: Repository<Driver>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly storage: StorageService,
  ) {}

  async getDriverProfile(userId: string): Promise<Driver> {
    const driver = await this.driverRepo.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!driver) throw new NotFoundException('Driver profile not found');
    return driver;
  }

  async updateDriverStatus(userId: string, status: DriverStatus): Promise<Driver> {
    const driver = await this.driverRepo.findOne({ where: { userId } });
    if (!driver) throw new NotFoundException('Driver not found');

    if (
      driver.verificationStatus !== VerificationStatus.APPROVED &&
      status === DriverStatus.ONLINE
    ) {
      throw new BadRequestException('Account not approved. Please wait for verification.');
    }

    await this.driverRepo.update(driver.id, { status });
    return this.driverRepo.findOne({ where: { id: driver.id }, relations: ['user'] });
  }

  async uploadDocument(
    userId: string,
    documentType: 'license' | 'insurance' | 'registration',
    file: Express.Multer.File,
  ): Promise<string> {
    const driver = await this.driverRepo.findOne({ where: { userId } });
    if (!driver) throw new NotFoundException('Driver not found');

    const key = `drivers/${driver.id}/${documentType}/${Date.now()}-${file.originalname}`;
    const url = await this.storage.uploadFile(key, file.buffer, file.mimetype);

    const updates: Partial<Driver> = {};
    if (documentType === 'license') updates.licenseImageUrl = url;
    else if (documentType === 'insurance') updates.vehicleInsuranceUrl = url;
    else if (documentType === 'registration') updates.vehicleRegistrationUrl = url;

    await this.driverRepo.update(driver.id, updates);
    return url;
  }

  async getEarningsSummary(userId: string) {
    const driver = await this.driverRepo.findOne({ where: { userId } });
    if (!driver) throw new NotFoundException('Driver not found');
    return {
      totalEarnings: driver.totalEarnings,
      pendingEarnings: driver.pendingEarnings,
      totalTrips: driver.totalTrips,
      acceptanceRate: driver.acceptanceRate,
      averageRating: driver.averageRating,
    };
  }

  async getPendingVerification(): Promise<Driver[]> {
    return this.driverRepo.find({
      where: { verificationStatus: VerificationStatus.PENDING },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async approveDriver(driverId: string, adminId: string): Promise<Driver> {
    const driver = await this.driverRepo.findOne({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('Driver not found');

    await this.driverRepo.update(driverId, {
      verificationStatus: VerificationStatus.APPROVED,
      verifiedAt: new Date(),
      verifiedByAdminId: adminId,
    });

    // Update user status to active
    await this.userRepo.update(driver.userId, { status: 'active' as any });

    return this.driverRepo.findOne({ where: { id: driverId }, relations: ['user'] });
  }

  async rejectDriver(
    driverId: string,
    adminId: string,
    notes: string,
  ): Promise<Driver> {
    await this.driverRepo.update(driverId, {
      verificationStatus: VerificationStatus.REJECTED,
      verifiedByAdminId: adminId,
      verificationNotes: notes,
    });
    return this.driverRepo.findOne({ where: { id: driverId }, relations: ['user'] });
  }
}
