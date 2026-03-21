import {
  IsNumber,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VehicleType } from '../../drivers/entities/driver.entity';

export class RequestRideDto {
  @ApiProperty({ example: 37.7749 })
  @IsNumber()
  @Min(-90) @Max(90)
  pickupLatitude: number;

  @ApiProperty({ example: -122.4194 })
  @IsNumber()
  @Min(-180) @Max(180)
  pickupLongitude: number;

  @ApiProperty({ example: '123 Main St, San Francisco, CA' })
  @IsString()
  @IsNotEmpty()
  pickupAddress: string;

  @ApiProperty({ example: 37.3382 })
  @IsNumber()
  @Min(-90) @Max(90)
  destinationLatitude: number;

  @ApiProperty({ example: -121.8863 })
  @IsNumber()
  @Min(-180) @Max(180)
  destinationLongitude: number;

  @ApiProperty({ example: '456 Oak Ave, San Jose, CA' })
  @IsString()
  @IsNotEmpty()
  destinationAddress: string;

  @ApiProperty({ enum: VehicleType, default: VehicleType.STANDARD })
  @IsEnum(VehicleType)
  @IsOptional()
  vehicleType?: VehicleType = VehicleType.STANDARD;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  specialRequests?: string;
}
