import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';
import { Rating } from './entities/rating.entity';
import { Ride } from '../rides/entities/ride.entity';
import { User } from '../users/entities/user.entity';
import { Driver } from '../drivers/entities/driver.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rating, Ride, User, Driver])],
  controllers: [RatingsController],
  providers: [RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}
