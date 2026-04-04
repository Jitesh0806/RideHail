import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.API_URL || 'http://10.0.2.2:3000/api/v1'; // Android emulator

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request: attach token
    this.client.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // Response: auto-refresh token on 401
    this.client.interceptors.response.use(
      (res) => res,
      async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
          original._retry = true;
          try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
            await AsyncStorage.setItem('accessToken', data.data.accessToken);
            original.headers.Authorization = `Bearer ${data.data.accessToken}`;
            return this.client(original);
          } catch {
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
            // Redirect to login handled by redux store listener
          }
        }
        return Promise.reject(error);
      },
    );
  }

  // ─── Auth ───────────────────────────────────────────────────────────────
  registerRider = (data: any) => this.client.post('/auth/rider/register', data);
  registerDriver = (data: any) => this.client.post('/auth/driver/register', data);
  login = (data: any) => this.client.post('/auth/login', data);
  refreshToken = (refreshToken: string) => this.client.post('/auth/refresh', { refreshToken });
  getMe = () => this.client.get('/auth/me');

  // ─── Users ──────────────────────────────────────────────────────────────
  getProfile = () => this.client.get('/users/profile');
  updateProfile = (data: any) => this.client.patch('/users/profile', data);
  updateFcmToken = (fcmToken: string) => this.client.patch('/users/fcm-token', { fcmToken });
  uploadProfilePicture = (formData: FormData) =>
    this.client.post('/users/profile/picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

  // ─── Rides ──────────────────────────────────────────────────────────────
  requestRide = (data: any) => this.client.post('/rides/request', data);
  getRide = (id: string) => this.client.get(`/rides/${id}`);
  getRideHistory = () => this.client.get('/rides/history');
  acceptRide = (id: string) => this.client.post(`/rides/${id}/accept`);
  rejectRide = (id: string) => this.client.post(`/rides/${id}/reject`);
  updateRideStatus = (id: string, status: string) =>
    this.client.patch(`/rides/${id}/status`, { status });
  cancelRide = (id: string, reason: string, note?: string) =>
    this.client.post(`/rides/${id}/cancel`, { reason, note });

  // ─── Locations ──────────────────────────────────────────────────────────
  getNearbyDrivers = (lat: number, lng: number, radius = 5) =>
    this.client.get('/locations/nearby-drivers', { params: { latitude: lat, longitude: lng, radius } });

  // ─── Drivers ────────────────────────────────────────────────────────────
  getDriverProfile = () => this.client.get('/drivers/profile');
  updateDriverStatus = (status: string) => this.client.patch('/drivers/status', { status });
  getDriverEarnings = () => this.client.get('/drivers/earnings');
  uploadDocument = (type: string, formData: FormData) =>
    this.client.post(`/drivers/documents/${type}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

  // ─── Payments ───────────────────────────────────────────────────────────
  createPaymentIntent = (data: any) => this.client.post('/payments/intent', data);
  getPaymentHistory = () => this.client.get('/payments/history');
  getEarnings = (startDate?: string, endDate?: string) =>
    this.client.get('/payments/earnings', { params: { startDate, endDate } });

  // ─── Ratings ────────────────────────────────────────────────────────────
  rateDriver = (data: any) => this.client.post('/ratings/rider', data);
  rateRider = (data: any) => this.client.post('/ratings/driver', data);
}

export const api = new ApiService();
