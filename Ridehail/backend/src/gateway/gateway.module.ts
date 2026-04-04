import { Module } from '@nestjs/common';
import { RideHailGateway } from './ridehail.gateway';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Driver } from '../drivers/entities/driver.entity';
import { Ride } from '../rides/entities/ride.entity';
import { LocationHistory } from '../locations/entities/location-history.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Driver, Ride, LocationHistory]),
  ],
  providers: [RideHailGateway],
  exports: [RideHailGateway],
})
export class GatewayModule {}
