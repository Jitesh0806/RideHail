import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating, RatingType } from './entities/rating.entity';
import { Ride, RideStatus } from '../rides/entities/ride.entity';
import { User } from '../users/entities/user.entity';
import { Driver } from '../drivers/entities/driver.entity';

export class SubmitRatingDto {
  rideId: string;
  score: number;          // 1–5
  comment?: string;
  tags?: string[];
}

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating) private readonly ratingRepo: Repository<Rating>,
    @InjectRepository(Ride) private readonly rideRepo: Repository<Ride>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Driver) private readonly driverRepo: Repository<Driver>,
  ) {}

  async submitRiderRating(riderId: string, dto: SubmitRatingDto): Promise<Rating> {
    const ride = await this.rideRepo.findOne({
      where: { id: dto.rideId, riderId },
      relations: ['driver'],
    });
    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.status !== RideStatus.COMPLETED) {
      throw new BadRequestException('Can only rate completed rides');
    }

    const existing = await this.ratingRepo.findOne({
      where: { rideId: dto.rideId, ratedById: riderId, type: RatingType.RIDER_TO_DRIVER },
    });
    if (existing) throw new BadRequestException('You have already rated this ride');

    if (dto.score < 1 || dto.score > 5) {
      throw new BadRequestException('Score must be between 1 and 5');
    }

    // Find the driver's user ID
    const driver = await this.driverRepo.findOne({ where: { id: ride.driverId } });

    const rating = this.ratingRepo.create({
      rideId: dto.rideId,
      type: RatingType.RIDER_TO_DRIVER,
      ratedById: riderId,
      ratedUserId: driver.userId,
      score: dto.score,
      comment: dto.comment,
      tags: dto.tags,
    });
    await this.ratingRepo.save(rating);

    // Update driver's average rating
    await this.updateDriverAverageRating(driver.id);

    return rating;
  }

  async submitDriverRating(driverUserId: string, dto: SubmitRatingDto): Promise<Rating> {
    const driver = await this.driverRepo.findOne({ where: { userId: driverUserId } });
    if (!driver) throw new NotFoundException('Driver not found');

    const ride = await this.rideRepo.findOne({
      where: { id: dto.rideId, driverId: driver.id },
    });
    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.status !== RideStatus.COMPLETED) {
      throw new BadRequestException('Can only rate completed rides');
    }

    const existing = await this.ratingRepo.findOne({
      where: { rideId: dto.rideId, ratedById: driverUserId, type: RatingType.DRIVER_TO_RIDER },
    });
    if (existing) throw new BadRequestException('You have already rated this ride');

    const rating = this.ratingRepo.create({
      rideId: dto.rideId,
      type: RatingType.DRIVER_TO_RIDER,
      ratedById: driverUserId,
      ratedUserId: ride.riderId,
      score: dto.score,
      comment: dto.comment,
      tags: dto.tags,
    });
    await this.ratingRepo.save(rating);

    // Update rider's average rating
    await this.updateUserAverageRating(ride.riderId);

    return rating;
  }

  private async updateDriverAverageRating(driverId: string): Promise<void> {
    const driver = await this.driverRepo.findOne({ where: { id: driverId } });
    const ratings = await this.ratingRepo.find({
      where: { ratedUserId: driver.userId, type: RatingType.RIDER_TO_DRIVER },
    });
    if (ratings.length === 0) return;
    const avg = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
    await this.driverRepo.update(driverId, { averageRating: Math.round(avg * 100) / 100 });
  }

  private async updateUserAverageRating(userId: string): Promise<void> {
    const ratings = await this.ratingRepo.find({
      where: { ratedUserId: userId, type: RatingType.DRIVER_TO_RIDER },
    });
    if (ratings.length === 0) return;
    const avg = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
    await this.userRepo.update(userId, { averageRating: Math.round(avg * 100) / 100 });
  }

  async getRideRating(rideId: string): Promise<Rating[]> {
    return this.ratingRepo.find({ where: { rideId } });
  }
}
