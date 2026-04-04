import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { Driver } from '../drivers/entities/driver.entity';
import { Ride } from '../rides/entities/ride.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Rating } from '../ratings/entities/rating.entity';
import { DriversModule } from '../drivers/drivers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Driver, Ride, Payment, Rating]),
    DriversModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
