import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';
import { Driver } from './entities/driver.entity';
import { User } from '../users/entities/user.entity';
import { StorageModule } from '../locations/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([Driver, User]), StorageModule],
  controllers: [DriversController],
  providers: [DriversService],
  exports: [DriversService],
})
export class DriversModule {}
