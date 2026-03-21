import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LocationsService } from './locations.service';
import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class NearbyDriversDto {
  @Type(() => Number) @IsNumber() latitude: number;
  @Type(() => Number) @IsNumber() longitude: number;
  @Type(() => Number) @IsNumber() @IsOptional() radius?: number = 5;
}

@ApiTags('locations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('nearby-drivers')
  @ApiOperation({ summary: 'Get online drivers nearby (for map display)' })
  async getNearbyDrivers(@Query() query: NearbyDriversDto) {
    return this.locationsService.getOnlineDriversNearby(
      query.latitude,
      query.longitude,
      query.radius,
    );
  }
}
