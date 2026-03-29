import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export const connectSocket = async () => {
  const token = await AsyncStorage.getItem('accessToken');
  socket = io(BASE_URL, { auth: { token }, transports: ['websocket'], reconnection: true, reconnectionAttempts: 5 });
  socket.on('connect', () => console.log('[Socket] Connected'));
  socket.on('disconnect', () => console.log('[Socket] Disconnected'));
  socket.on('connect_error', (e) => console.log('[Socket] Error (demo mode — OK):', e.message));
  return socket;
};

export const disconnectSocket = () => { socket?.disconnect(); socket = null; };

export const getSocket = () => socket;

export const sendLocationUpdate = (latitude: number, longitude: number) => {
  socket?.emit('driver:location_update', { latitude, longitude });
};

export const goOnline = () => socket?.emit('driver:go_online');
export const goOffline = () => socket?.emit('driver:go_offline');
export const joinRide = (rideId: string) => socket?.emit('ride:join', { rideId });
export const leaveRide = (rideId: string) => socket?.emit('ride:leave', { rideId });

export const onDriverLocation = (cb: (data: any) => void) => { socket?.on('driver:location', cb); };
export const onRideUpdate = (cb: (data: any) => void) => { socket?.on('ride:update', cb); };
export const onRideRequest = (cb: (data: any) => void) => { socket?.on('ride:request', cb); };
export const offDriverLocation = (cb?: (data: any) => void) => { socket?.off('driver:location', cb); };
export const offRideUpdate = (cb?: (data: any) => void) => { socket?.off('ride:update', cb); };
export const offRideRequest = (cb?: (data: any) => void) => { socket?.off('ride:request', cb); };
