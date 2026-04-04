import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { IsString } from 'class-validator';

class UpdateFcmTokenDto {
  @IsString()
  fcmToken: string;
}

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('test')
  async testNotification(@Request() req, @Body() dto: { title: string; body: string }) {
    // For development testing only
    return { message: 'Notification service ready' };
  }
}
