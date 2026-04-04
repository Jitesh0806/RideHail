import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationHistory } from './entities/location-history.entity';
import { Driver, DriverStatus } from '../drivers/entities/driver.entity';
import { getDistance } from 'geolib';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(LocationHistory)
    private readonly locationHistoryRepo: Repository<LocationHistory>,
    @InjectRepository(Driver) private readonly driverRepo: Repository<Driver>,
  ) {}

  async getOnlineDriversNearby(
    latitude: number,
    longitude: number,
    radiusKm: number = 5,
  ) {
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

    const drivers = await this.driverRepo
      .createQueryBuilder('driver')
      .leftJoinAndSelect('driver.user', 'user')
      .where('driver.status = :status', { status: DriverStatus.ONLINE })
      .andWhere('driver.currentLatitude BETWEEN :minLat AND :maxLat', {
        minLat: latitude - latDelta,
        maxLat: latitude + latDelta,
      })
      .andWhere('driver.currentLongitude BETWEEN :minLng AND :maxLng', {
        minLng: longitude - lngDelta,
        maxLng: longitude + lngDelta,
      })
      .getMany();

    return drivers
      .map((driver) => {
        const distanceM = getDistance(
          { latitude, longitude },
          {
            latitude: Number(driver.currentLatitude),
            longitude: Number(driver.currentLongitude),
          },
        );
        return {
          driverId: driver.id,
          latitude: driver.currentLatitude,
          longitude: driver.currentLongitude,
          vehicleType: driver.vehicleType,
          distanceKm: distanceM / 1000,
          estimatedMinutes: Math.ceil(distanceM / 1000 / 0.5),
        };
      })
      .filter((d) => d.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  async getDriverLocationHistory(driverId: string, rideId?: string) {
    const query = this.locationHistoryRepo
      .createQueryBuilder('loc')
      .where('loc.driverId = :driverId', { driverId })
      .orderBy('loc.createdAt', 'ASC');

    if (rideId) query.andWhere('loc.rideId = :rideId', { rideId });

    return query.take(1000).getMany();
  }
}
