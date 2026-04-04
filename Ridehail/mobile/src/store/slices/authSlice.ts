import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';
import { AuthState, User } from '../../types';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
};

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.login(credentials);
      const { accessToken, refreshToken, user } = data.data;
      await AsyncStorage.multiSet([
        ['accessToken', accessToken],
        ['refreshToken', refreshToken],
        ['user', JSON.stringify(user)],
      ]);
      await socketService.connect();
      return { accessToken, refreshToken, user };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  },
);

export const registerRiderThunk = createAsyncThunk(
  'auth/registerRider',
  async (data: any, { rejectWithValue }) => {
    try {
      const { data: res } = await api.registerRider(data);
      const { accessToken, refreshToken, user } = res.data;
      await AsyncStorage.multiSet([
        ['accessToken', accessToken],
        ['refreshToken', refreshToken],
        ['user', JSON.stringify(user)],
      ]);
      await socketService.connect();
      return { accessToken, refreshToken, user };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  },
);

export const registerDriverThunk = createAsyncThunk(
  'auth/registerDriver',
  async (data: any, { rejectWithValue }) => {
    try {
      const { data: res } = await api.registerDriver(data);
      const { accessToken, refreshToken, user } = res.data;
      await AsyncStorage.multiSet([
        ['accessToken', accessToken],
        ['refreshToken', refreshToken],
        ['user', JSON.stringify(user)],
      ]);
      await socketService.connect();
      return { accessToken, refreshToken, user };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  },
);

export const restoreSessionThunk = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    try {
      const [[, token], [, refresh], [, userStr]] = await AsyncStorage.multiGet([
        'accessToken', 'refreshToken', 'user',
      ]);
      if (!token || !userStr) throw new Error('No session');
      await socketService.connect();
      return { accessToken: token, refreshToken: refresh, user: JSON.parse(userStr) };
    } catch {
      return rejectWithValue('No saved session');
    }
  },
);

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  socketService.disconnect();
  await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    const setLoading = (state: AuthState) => { state.isLoading = true; state.error = null; };
    const setSuccess = (state: AuthState, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    };
    const setError = (state: AuthState, action: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = action.payload;
    };

    builder
      .addCase(loginThunk.pending, setLoading)
      .addCase(loginThunk.fulfilled, setSuccess)
      .addCase(loginThunk.rejected, setError)
      .addCase(registerRiderThunk.pending, setLoading)
      .addCase(registerRiderThunk.fulfilled, setSuccess)
      .addCase(registerRiderThunk.rejected, setError)
      .addCase(registerDriverThunk.pending, setLoading)
      .addCase(registerDriverThunk.fulfilled, setSuccess)
      .addCase(registerDriverThunk.rejected, setError)
      .addCase(restoreSessionThunk.fulfilled, setSuccess)
      .addCase(logoutThunk.fulfilled, () => initialState);
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
