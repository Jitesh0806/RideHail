import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SNSClient, PublishCommand, CreatePlatformEndpointCommand } from '@aws-sdk/client-sns';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly sns: SNSClient;
  private readonly platformApplicationArn: string;

  constructor(private readonly config: ConfigService) {
    this.sns = new SNSClient({
      region: config.get('SNS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: config.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
    this.platformApplicationArn = config.get('SNS_PLATFORM_APPLICATION_ARN');
  }

  async sendPushNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    if (!this.platformApplicationArn || !this.config.get('AWS_ACCESS_KEY_ID')) {
      this.logger.debug(`[Mock] Push notification → "${title}": ${body}`);
      return;
    }
    try {
      // Register device endpoint
      const endpointCmd = new CreatePlatformEndpointCommand({
        PlatformApplicationArn: this.platformApplicationArn,
        Token: fcmToken,
      });
      const endpointResult = await this.sns.send(endpointCmd);
      const endpointArn = endpointResult.EndpointArn;

      // Compose message
      const message = JSON.stringify({
        GCM: JSON.stringify({
          notification: { title, body },
          data: data || {},
        }),
      });

      const publishCmd = new PublishCommand({
        TargetArn: endpointArn,
        Message: message,
        MessageStructure: 'json',
      });

      await this.sns.send(publishCmd);
      this.logger.log(`Push notification sent: ${title}`);
    } catch (err) {
      this.logger.error('SNS push notification failed:', err.message);
      // Non-fatal - log and continue
    }
  }

  async sendSms(phoneNumber: string, message: string): Promise<void> {
    if (!this.config.get('AWS_ACCESS_KEY_ID')) {
      this.logger.debug(`[Mock] SMS → ${phoneNumber}: ${message}`);
      return;
    }
    try {
      const cmd = new PublishCommand({
        PhoneNumber: phoneNumber,
        Message: message,
      });
      await this.sns.send(cmd);
      this.logger.log(`SMS sent to ${phoneNumber}`);
    } catch (err) {
      this.logger.error('SMS send failed:', err.message);
    }
  }

  // Predefined notification templates
  async notifyRiderDriverAssigned(riderFcmToken: string, driverName: string, rideId: string) {
    await this.sendPushNotification(
      riderFcmToken,
      'Driver Assigned!',
      `${driverName} is heading to your pickup location`,
      { rideId, type: 'driver_assigned' },
    );
  }

  async notifyRiderDriverArrived(riderFcmToken: string, rideId: string) {
    await this.sendPushNotification(
      riderFcmToken,
      'Driver Arrived!',
      'Your driver has arrived at the pickup location',
      { rideId, type: 'driver_arrived' },
    );
  }

  async notifyRiderTripStarted(riderFcmToken: string, rideId: string) {
    await this.sendPushNotification(
      riderFcmToken,
      'Trip Started',
      'Enjoy your ride!',
      { rideId, type: 'trip_started' },
    );
  }

  async notifyRiderTripCompleted(riderFcmToken: string, rideId: string, fare: number) {
    await this.sendPushNotification(
      riderFcmToken,
      'Trip Completed',
      `Your trip is complete. Total: $${fare.toFixed(2)}`,
      { rideId, type: 'trip_completed' },
    );
  }

  async notifyDriverNewRideRequest(driverFcmToken: string, rideId: string, pickupAddress: string) {
    await this.sendPushNotification(
      driverFcmToken,
      'New Ride Request!',
      `Pickup at: ${pickupAddress}`,
      { rideId, type: 'new_ride_request' },
    );
  }
}
