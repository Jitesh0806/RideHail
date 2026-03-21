import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VehicleType } from '../../drivers/entities/driver.entity';

export class RegisterDriverDto {
  @ApiProperty() @IsString() @IsNotEmpty() firstName: string;
  @ApiProperty() @IsString() @IsNotEmpty() lastName: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @IsNotEmpty() phone: string;
  @ApiProperty() @IsString() @MinLength(8) password: string;

  // Vehicle
  @ApiProperty() @IsString() @IsNotEmpty() vehicleMake: string;
  @ApiProperty() @IsString() @IsNotEmpty() vehicleModel: string;
  @ApiProperty() @IsInt() @Min(2000) @Max(new Date().getFullYear() + 1) vehicleYear: number;
  @ApiProperty() @IsString() @IsNotEmpty() vehicleColor: string;
  @ApiProperty() @IsString() @IsNotEmpty() vehiclePlate: string;

  @ApiProperty({ enum: VehicleType })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  // License
  @ApiProperty() @IsString() @IsNotEmpty() licenseNumber: string;
  @ApiProperty() @IsDateString() licenseExpiry: string;
}
