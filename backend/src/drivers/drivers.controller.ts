import {
  Controller, Get, Patch, Post, Body, Param, UseGuards,
  Request, UseInterceptors, UploadedFile, ParseFilePipe,
  MaxFileSizeValidator, FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DriversService } from './drivers.service';
import { DriverStatus } from './entities/driver.entity';
import { IsEnum } from 'class-validator';

class UpdateStatusDto {
  @IsEnum(DriverStatus)
  status: DriverStatus;
}

@ApiTags('drivers')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get driver profile' })
  async getProfile(@Request() req) {
    return this.driversService.getDriverProfile(req.user.id);
  }

  @Patch('status')
  @ApiOperation({ summary: 'Go online / offline' })
  async updateStatus(@Request() req, @Body() dto: UpdateStatusDto) {
    return this.driversService.updateDriverStatus(req.user.id, dto.status);
  }

  @Get('earnings')
  @ApiOperation({ summary: 'Get earnings summary' })
  async getEarnings(@Request() req) {
    return this.driversService.getEarningsSummary(req.user.id);
  }

  @Post('documents/:type')
  @ApiOperation({ summary: 'Upload verification document (license/insurance/registration)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Request() req,
    @Param('type') type: 'license' | 'insurance' | 'registration',
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /image\/(jpeg|png|webp)|application\/pdf/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const url = await this.driversService.uploadDocument(req.user.id, type, file);
    return { url };
  }
}
