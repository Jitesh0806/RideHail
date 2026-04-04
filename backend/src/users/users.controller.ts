import {
  Controller, Get, Patch, Post, Body, UseGuards,
  Request, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { IsString, IsOptional } from 'class-validator';

class UpdateProfileDto {
  @IsString() @IsOptional() firstName?: string;
  @IsString() @IsOptional() lastName?: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() fcmToken?: string;
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update profile' })
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Post('profile/picture')
  @ApiOperation({ summary: 'Upload profile picture' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPicture(
    @Request() req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /image\/(jpeg|png|webp)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const url = await this.usersService.uploadProfilePicture(req.user.id, file);
    return { profilePictureUrl: url };
  }

  @Patch('fcm-token')
  @ApiOperation({ summary: 'Update FCM push token' })
  async updateFcmToken(@Request() req, @Body() body: { fcmToken: string }) {
    await this.usersService.updateFcmToken(req.user.id, body.fcmToken);
    return { message: 'FCM token updated' };
  }
}
