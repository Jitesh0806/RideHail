import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RidesController } from './rides.controller';
import { RidesService } from './rides.service';
import { DriverMatchingService } from './driver-matching.service';
import { Ride } from './entities/ride.entity';
import { Driver } from '../drivers/entities/driver.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ride, Driver, User]),
    NotificationsModule,
    PaymentsModule,
  ],
  controllers: [RidesController],
  providers: [RidesService, DriverMatchingService],
  exports: [RidesService],
})
export class RidesModule {}
