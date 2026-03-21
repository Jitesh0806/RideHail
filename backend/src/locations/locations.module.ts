import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { LocationHistory } from './entities/location-history.entity';
import { Driver } from '../drivers/entities/driver.entity';
import { StorageModule } from './storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([LocationHistory, Driver]), StorageModule],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService, StorageModule],
})
export class LocationsModule {}
