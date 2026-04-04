import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RidesService } from './rides.service';
import { RequestRideDto } from './dto/request-ride.dto';
import { RideStatus, CancellationReason } from './entities/ride.entity';
import { IsEnum, IsOptional, IsString } from 'class-validator';

class UpdateRideStatusDto {
  @IsEnum(RideStatus)
  status: RideStatus;
}

class CancelRideDto {
  @IsEnum(CancellationReason)
  reason: CancellationReason;

  @IsString()
  @IsOptional()
  note?: string;
}

@ApiTags('rides')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('rides')
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Post('request')
  @ApiOperation({ summary: 'Rider: Request a new ride' })
  async requestRide(@Request() req, @Body() dto: RequestRideDto) {
    return this.ridesService.requestRide(req.user.id, dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get ride history for current user' })
  async getHistory(@Request() req) {
    const isDriver = req.user.role === 'driver';
    return this.ridesService.getRideHistory(req.user.id, isDriver);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ride details' })
  async getRide(@Param('id') id: string) {
    return this.ridesService.getRideById(id);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Driver: Accept a ride request' })
  async acceptRide(@Request() req, @Param('id') id: string) {
    return this.ridesService.driverAcceptRide(req.user.id, id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Driver: Reject a ride request' })
  async rejectRide(@Request() req, @Param('id') id: string) {
    return this.ridesService.driverRejectRide(req.user.id, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Driver: Update ride status' })
  async updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateRideStatusDto,
  ) {
    const isDriver = req.user.role === 'driver';
    return this.ridesService.updateRideStatus(req.user.id, id, dto.status, isDriver);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a ride' })
  async cancelRide(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CancelRideDto,
  ) {
    const isDriver = req.user.role === 'driver';
    return this.ridesService.cancelRide(
      req.user.id,
      id,
      dto.reason,
      dto.note,
      isDriver,
    );
  }
}
