import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { IsString, IsOptional, IsDateString } from 'class-validator';

class RejectDriverDto {
  @IsString() notes: string;
}

class CancelRideDto {
  @IsString() reason: string;
}

class SuspendUserDto {
  @IsString() reason: string;
}

class AnalyticsQueryDto {
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard statistics' })
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  // ─── Rides ───────────────────────────────────────────────────────────────

  @Get('rides/active')
  @ApiOperation({ summary: 'Get all active rides' })
  async getActiveRides() {
    return this.adminService.getActiveRides();
  }

  @Post('rides/:id/cancel')
  @ApiOperation({ summary: 'Force cancel a ride' })
  async cancelRide(@Param('id') id: string, @Body() dto: CancelRideDto) {
    return this.adminService.adminCancelRide(id, dto.reason);
  }

  // ─── Users ────────────────────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  async getUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllUsers(+page, +limit, search);
  }

  @Patch('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend a user' })
  async suspendUser(@Param('id') id: string, @Body() dto: SuspendUserDto) {
    return this.adminService.suspendUser(id, dto.reason);
  }

  @Patch('users/:id/activate')
  @ApiOperation({ summary: 'Reactivate a user' })
  async activateUser(@Param('id') id: string) {
    return this.adminService.activateUser(id);
  }

  // ─── Drivers ──────────────────────────────────────────────────────────────

  @Get('drivers/pending')
  @ApiOperation({ summary: 'Get drivers pending verification' })
  async getPendingDrivers() {
    return this.adminService.getPendingDrivers();
  }

  @Post('drivers/:id/approve')
  @ApiOperation({ summary: 'Approve driver registration' })
  async approveDriver(@Param('id') id: string, @Request() req) {
    return this.adminService.approveDriver(id, req.user.id);
  }

  @Post('drivers/:id/reject')
  @ApiOperation({ summary: 'Reject driver registration' })
  async rejectDriver(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: RejectDriverDto,
  ) {
    return this.adminService.rejectDriver(id, req.user.id, dto.notes);
  }

  @Patch('drivers/:id/suspend')
  @ApiOperation({ summary: 'Suspend a driver' })
  async suspendDriver(@Param('id') id: string) {
    return this.adminService.suspendDriver(id);
  }

  // ─── Analytics ────────────────────────────────────────────────────────────

  @Get('analytics')
  @ApiOperation({ summary: 'Get analytics for a date range' })
  async getAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.adminService.getAnalytics(
      new Date(query.startDate),
      new Date(query.endDate),
    );
  }

  @Get('drivers/distribution')
  @ApiOperation({ summary: 'Get live driver locations for map' })
  async getDriverDistribution() {
    return this.adminService.getDriverDistribution();
  }
}
