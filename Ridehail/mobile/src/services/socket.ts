import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WS_URL = process.env.WS_URL || 'http://10.0.2.2:3000/ridehail';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  async connect(): Promise<void> {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) return;

    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    // Re-attach listeners after reconnect
    this.socket.on('reconnect', () => {
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach((cb) => this.socket?.on(event, cb as any));
      });
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.listeners.clear();
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    this.socket?.on(event, callback as any);
  }

  off(event: string, callback?: Function): void {
    if (callback) {
      const cbs = this.listeners.get(event) || [];
      this.listeners.set(event, cbs.filter((c) => c !== callback));
      this.socket?.off(event, callback as any);
    } else {
      this.listeners.delete(event);
      this.socket?.off(event);
    }
  }

  emit(event: string, data?: any): void {
    this.socket?.emit(event, data);
  }

  // ─── Driver-specific ────────────────────────────────────────────────────

  sendLocationUpdate(latitude: number, longitude: number, heading?: number, speed?: number) {
    this.emit('driver:location_update', { latitude, longitude, heading, speed });
  }

  goOnline() {
    this.emit('driver:go_online');
  }

  goOffline() {
    this.emit('driver:go_offline');
  }

  // ─── Ride room ──────────────────────────────────────────────────────────

  joinRide(rideId: string) {
    this.emit('ride:join', { rideId });
  }

  leaveRide(rideId: string) {
    this.emit('ride:leave', { rideId });
  }

  // ─── Event listeners ────────────────────────────────────────────────────

  onDriverLocation(callback: (data: { latitude: number; longitude: number; heading?: number; rideId: string }) => void) {
    this.on('driver:location', callback);
  }

  onRideRequest(callback: (data: { rideId: string }) => void) {
    this.on('ride:request', callback);
  }

  onRideStatusUpdate(callback: (data: { rideId: string; status: string }) => void) {
    this.on('ride:status_update', callback);
  }

  onDriverStatusUpdate(callback: (data: { status: string }) => void) {
    this.on('driver:status_updated', callback);
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
