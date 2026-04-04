import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RatingsService, SubmitRatingDto } from './ratings.service';

@ApiTags('ratings')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post('rider')
  @ApiOperation({ summary: 'Rider: Rate driver after ride' })
  async rateDriver(@Request() req, @Body() dto: SubmitRatingDto) {
    return this.ratingsService.submitRiderRating(req.user.id, dto);
  }

  @Post('driver')
  @ApiOperation({ summary: 'Driver: Rate rider after ride' })
  async rateRider(@Request() req, @Body() dto: SubmitRatingDto) {
    return this.ratingsService.submitDriverRating(req.user.id, dto);
  }

  @Get('ride/:rideId')
  @ApiOperation({ summary: 'Get ratings for a ride' })
  async getRideRatings(@Param('rideId') rideId: string) {
    return this.ratingsService.getRideRating(rideId);
  }
}
