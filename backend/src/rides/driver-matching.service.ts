import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Driver, DriverStatus, VerificationStatus } from '../drivers/entities/driver.entity';
import { VehicleType } from '../drivers/entities/driver.entity';
import { getDistance } from 'geolib';

export interface NearbyDriver {
  driver: Driver;
  distanceKm: number;
  estimatedArrivalMinutes: number;
}

@Injectable()
export class DriverMatchingService {
  private readonly logger = new Logger(DriverMatchingService.name);

  private readonly initialRadius: number;
  private readonly maxRadius: number;
  private readonly expansionInterval: number;

  constructor(
    @InjectRepository(Driver) private readonly driverRepo: Repository<Driver>,
    private readonly config: ConfigService,
  ) {
    this.initialRadius = config.get<number>('INITIAL_DRIVER_SEARCH_RADIUS', 3);
    this.maxRadius = config.get<number>('MAX_DRIVER_SEARCH_RADIUS', 10);
    this.expansionInterval = config.get<number>('RADIUS_EXPANSION_INTERVAL_MS', 120000);
  }

  async findNearbyDrivers(
    latitude: number,
    longitude: number,
    vehicleType?: VehicleType,
    radiusKm: number = this.initialRadius,
  ): Promise<NearbyDriver[]> {
    // Fetch all online, verified drivers
    const query = this.driverRepo
      .createQueryBuilder('driver')
      .leftJoinAndSelect('driver.user', 'user')
      .where('driver.status = :status', { status: DriverStatus.ONLINE })
      .andWhere('driver.verificationStatus = :verified', {
        verified: VerificationStatus.APPROVED,
      })
      .andWhere('driver.currentLatitude IS NOT NULL')
      .andWhere('driver.currentLongitude IS NOT NULL');

    if (vehicleType) {
      query.andWhere('driver.vehicleType = :vehicleType', { vehicleType });
    }

    // Bounding box optimization before precise distance calc
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

    query
      .andWhere('driver.currentLatitude BETWEEN :minLat AND :maxLat', {
        minLat: latitude - latDelta,
        maxLat: latitude + latDelta,
      })
      .andWhere('driver.currentLongitude BETWEEN :minLng AND :maxLng', {
        minLng: longitude - lngDelta,
        maxLng: longitude + lngDelta,
      });

    const drivers = await query.getMany();

    // Precise distance filter & sort
    const nearbyDrivers: NearbyDriver[] = drivers
      .map((driver) => {
        const distanceM = getDistance(
          { latitude, longitude },
          {
            latitude: Number(driver.currentLatitude),
            longitude: Number(driver.currentLongitude),
          },
        );
        const distanceKm = distanceM / 1000;
        const estimatedArrivalMinutes = Math.ceil(distanceKm / 0.5); // ~30 km/h in city
        return { driver, distanceKm, estimatedArrivalMinutes };
      })
      .filter((d) => d.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    this.logger.log(
      `Found ${nearbyDrivers.length} drivers within ${radiusKm}km of (${latitude}, ${longitude})`,
    );

    return nearbyDrivers;
  }

  calculateFare(
    distanceKm: number,
    vehicleType: VehicleType = VehicleType.STANDARD,
    surgeMultiplier: number = 1,
  ): number {
    const baseFares: Record<VehicleType, { base: number; perKm: number; perMin: number }> = {
      [VehicleType.ECONOMY]: { base: 2.0, perKm: 0.8, perMin: 0.1 },
      [VehicleType.STANDARD]: { base: 2.5, perKm: 1.2, perMin: 0.15 },
      [VehicleType.PREMIUM]: { base: 5.0, perKm: 2.0, perMin: 0.3 },
      [VehicleType.XL]: { base: 4.0, perKm: 1.5, perMin: 0.2 },
    };

    const fare = baseFares[vehicleType];
    const estimatedMinutes = (distanceKm / 30) * 60;
    const rawFare =
      fare.base + distanceKm * fare.perKm + estimatedMinutes * fare.perMin;

    return Math.round(rawFare * surgeMultiplier * 100) / 100;
  }

  getNextSearchRadius(currentRadius: number): number | null {
    if (currentRadius >= this.maxRadius) return null;

    const steps = [3, 5, 8, 10];
    const nextStep = steps.find((s) => s > currentRadius);
    return nextStep ?? null;
  }
}
