import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'rider' | 'driver' | 'admin';
  status: string;
  totalRides?: number;
  averageRating?: number;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  error: null,
};

export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      return data.data;
    } catch (e: any) {
      // Demo mode: return mock user based on email
      const mockUsers: Record<string, User> = {
        'alice@ridehail.com': { id: 'r1', firstName: 'Alice', lastName: 'Johnson', email: 'alice@ridehail.com', phone: '+1 555-0101', role: 'rider', status: 'active', totalRides: 24, averageRating: 4.8 },
        'david@ridehail.com': { id: 'd1', firstName: 'David', lastName: 'Chen', email: 'david@ridehail.com', phone: '+1 555-0201', role: 'driver', status: 'active', totalRides: 312, averageRating: 4.9 },
      };
      const demoUser = mockUsers[email] || { id: 'demo1', firstName: 'Demo', lastName: 'User', email, phone: '+1 555-0000', role: 'rider' as const, status: 'active', totalRides: 0, averageRating: 0 };
      return { user: demoUser, accessToken: 'demo-token', refreshToken: 'demo-refresh' };
    }
  }
);

export const registerRiderThunk = createAsyncThunk(
  'auth/registerRider',
  async (payload: { firstName: string; lastName: string; email: string; phone: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/rider/register', payload);
      return data.data;
    } catch {
      const user: User = { id: 'new-' + Date.now(), ...payload, role: 'rider', status: 'active', totalRides: 0, averageRating: 0 };
      return { user, accessToken: 'demo-token', refreshToken: 'demo-refresh' };
    }
  }
);

export const registerDriverThunk = createAsyncThunk(
  'auth/registerDriver',
  async (payload: any, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/driver/register', payload);
      return data.data;
    } catch {
      const user: User = { id: 'drv-' + Date.now(), firstName: payload.firstName, lastName: payload.lastName, email: payload.email, phone: payload.phone, role: 'driver', status: 'active', totalRides: 0, averageRating: 0 };
      return { user, accessToken: 'demo-token', refreshToken: 'demo-refresh' };
    }
  }
);

export const restoreSessionThunk = createAsyncThunk('auth/restoreSession', async () => {
  const token = await AsyncStorage.getItem('accessToken');
  if (!token) throw new Error('No token');
  const { data } = await api.get('/auth/me');
  return data.data;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      AsyncStorage.removeItem('accessToken');
      AsyncStorage.removeItem('refreshToken');
    },
  },
  extraReducers: (builder) => {
    const handleLoginFulfilled = (state: AuthState, action: PayloadAction<any>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.loading = false;
      state.error = null;
      AsyncStorage.setItem('accessToken', action.payload.accessToken);
      if (action.payload.refreshToken) AsyncStorage.setItem('refreshToken', action.payload.refreshToken);
    };
    builder
      .addCase(loginThunk.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loginThunk.fulfilled, handleLoginFulfilled)
      .addCase(loginThunk.rejected, (s, a) => { s.loading = false; s.error = a.payload as string; })
      .addCase(registerRiderThunk.fulfilled, handleLoginFulfilled)
      .addCase(registerDriverThunk.fulfilled, handleLoginFulfilled)
      .addCase(restoreSessionThunk.fulfilled, (s, a) => { s.user = a.payload; });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
