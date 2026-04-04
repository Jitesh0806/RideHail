import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your local IP when backend is running, e.g. http://192.168.1.100:3000
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({ baseURL: BASE_URL, timeout: 10000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refresh = await AsyncStorage.getItem('refreshToken');
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: refresh });
          await AsyncStorage.setItem('accessToken', data.data.accessToken);
          error.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api.request(error.config);
        } catch {}
      }
    }
    return Promise.reject(error);
  }
);
