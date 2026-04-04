import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Driver } from '../drivers/entities/driver.entity';
import { Ride, RideStatus } from '../rides/entities/ride.entity';
import { LocationHistory } from '../locations/entities/location-history.entity';

interface LocationUpdate {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/ridehail',
})
export class RideHailGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RideHailGateway.name);

  // Map: userId -> socketId
  private userSockets = new Map<string, string>();
  // Map: socketId -> userId
  private socketUsers = new Map<string, string>();

  constructor(
    @InjectRepository(Driver) private readonly driverRepo: Repository<Driver>,
    @InjectRepository(Ride) private readonly rideRepo: Repository<Ride>,
    @InjectRepository(LocationHistory)
    private readonly locationHistoryRepo: Repository<LocationHistory>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('RideHail WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token, {
        secret: this.config.get('JWT_SECRET'),
      });
      const userId = payload.sub;

      this.userSockets.set(userId, client.id);
      this.socketUsers.set(client.id, userId);

      // Join personal room
      client.join(`user:${userId}`);

      this.logger.log(`Client connected: ${userId} (${client.id})`);
    } catch {
      this.logger.warn('Unauthorized WebSocket connection attempt');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketUsers.get(client.id);
    if (userId) {
      this.userSockets.delete(userId);
      this.socketUsers.delete(client.id);
      this.logger.log(`Client disconnected: ${userId}`);
    }
  }

  // ─── Driver Events ────────────────────────────────────────────────────────

  @SubscribeMessage('driver:location_update')
  async handleDriverLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: LocationUpdate,
  ) {
    const userId = this.socketUsers.get(client.id);
    if (!userId) return;

    const driver = await this.driverRepo.findOne({ where: { userId } });
    if (!driver) return;

    // Update driver's current location in DB
    await this.driverRepo.update(driver.id, {
      currentLatitude: data.latitude,
      currentLongitude: data.longitude,
      locationUpdatedAt: new Date(),
    });

    // Save to location history
    await this.locationHistoryRepo.save({
      driverId: driver.id,
      latitude: data.latitude,
      longitude: data.longitude,
      heading: data.heading,
      speedKmh: data.speed,
      accuracy: data.accuracy,
    });

    // If driver is on a ride, broadcast location to rider
    const activeRide = await this.rideRepo.findOne({
      where: {
        driverId: driver.id,
        status: RideStatus.IN_PROGRESS,
      },
    });
    if (activeRide) {
      this.server.to(`user:${activeRide.riderId}`).emit('driver:location', {
        rideId: activeRide.id,
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading,
        speed: data.speed,
        timestamp: new Date().toISOString(),
      });
    }

    // Also broadcast to DRIVER_EN_ROUTE rides
    const enRouteRide = await this.rideRepo.findOne({
      where: {
        driverId: driver.id,
        status: RideStatus.DRIVER_EN_ROUTE,
      },
    });
    if (enRouteRide) {
      this.server.to(`user:${enRouteRide.riderId}`).emit('driver:location', {
        rideId: enRouteRide.id,
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading,
        speed: data.speed,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('driver:go_online')
  async handleGoOnline(@ConnectedSocket() client: Socket) {
    const userId = this.socketUsers.get(client.id);
    if (!userId) return;
    await this.driverRepo.update({ userId }, { status: 'online' as any });
    client.emit('driver:status_updated', { status: 'online' });
    this.logger.log(`Driver ${userId} went ONLINE`);
  }

  @SubscribeMessage('driver:go_offline')
  async handleGoOffline(@ConnectedSocket() client: Socket) {
    const userId = this.socketUsers.get(client.id);
    if (!userId) return;
    await this.driverRepo.update({ userId }, { status: 'offline' as any });
    client.emit('driver:status_updated', { status: 'offline' });
    this.logger.log(`Driver ${userId} went OFFLINE`);
  }

  // ─── Ride Room Management ─────────────────────────────────────────────────

  @SubscribeMessage('ride:join')
  handleJoinRide(@ConnectedSocket() client: Socket, @MessageBody() data: { rideId: string }) {
    client.join(`ride:${data.rideId}`);
    this.logger.log(`Client ${client.id} joined ride room ${data.rideId}`);
  }

  @SubscribeMessage('ride:leave')
  handleLeaveRide(@ConnectedSocket() client: Socket, @MessageBody() data: { rideId: string }) {
    client.leave(`ride:${data.rideId}`);
  }

  // ─── Server-emitted event helpers ────────────────────────────────────────

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitRideUpdate(rideId: string, event: string, data: any) {
    this.server.to(`ride:${rideId}`).emit(event, data);
  }

  emitToAll(event: string, data: any) {
    this.server.emit(event, data);
  }
}
