import axios, { AxiosInstance } from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

class AdminApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({ baseURL: BASE_URL, timeout: 15000 });
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    this.client.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
        }
        return Promise.reject(err);
      },
    );
  }

  login = (email: string, password: string) => this.client.post('/auth/login', { email, password });

  // Dashboard
  getDashboard = () => this.client.get('/admin/dashboard');

  // Rides
  getActiveRides = () => this.client.get('/admin/rides/active');
  cancelRide = (id: string, reason: string) => this.client.post(`/admin/rides/${id}/cancel`, { reason });

  // Users
  getUsers = (page = 1, limit = 20, search?: string) =>
    this.client.get('/admin/users', { params: { page, limit, search } });
  suspendUser = (id: string, reason: string) => this.client.patch(`/admin/users/${id}/suspend`, { reason });
  activateUser = (id: string) => this.client.patch(`/admin/users/${id}/activate`);

  // Drivers
  getPendingDrivers = () => this.client.get('/admin/drivers/pending');
  approveDriver = (id: string) => this.client.post(`/admin/drivers/${id}/approve`);
  rejectDriver = (id: string, notes: string) => this.client.post(`/admin/drivers/${id}/reject`, { notes });
  suspendDriver = (id: string) => this.client.patch(`/admin/drivers/${id}/suspend`);
  getDriverDistribution = () => this.client.get('/admin/drivers/distribution');

  // Analytics
  getAnalytics = (startDate: string, endDate: string) =>
    this.client.get('/admin/analytics', { params: { startDate, endDate } });
}

export const adminApi = new AdminApiService();
