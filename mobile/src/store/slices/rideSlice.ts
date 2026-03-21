import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../services/api';
import { Ride, RideState, NearbyDriver, Location } from '../../types';

const initialState: RideState = {
  currentRide: null,
  rideHistory: [],
  isSearching: false,
  nearbyDrivers: [],
  driverLocation: null,
};

export const requestRideThunk = createAsyncThunk(
  'ride/request',
  async (data: any, { rejectWithValue }) => {
    try {
      const { data: res } = await api.requestRide(data);
      return res.data as Ride;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to request ride');
    }
  },
);

export const cancelRideThunk = createAsyncThunk(
  'ride/cancel',
  async ({ rideId, reason }: { rideId: string; reason: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.cancelRide(rideId, reason);
      return data.data as Ride;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Cancel failed');
    }
  },
);

export const fetchRideHistoryThunk = createAsyncThunk(
  'ride/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.getRideHistory();
      return data.data as Ride[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch history');
    }
  },
);

export const fetchNearbyDriversThunk = createAsyncThunk(
  'ride/fetchNearbyDrivers',
  async ({ lat, lng }: { lat: number; lng: number }, { rejectWithValue }) => {
    try {
      const { data } = await api.getNearbyDrivers(lat, lng);
      return data.data as NearbyDriver[];
    } catch {
      return rejectWithValue('Failed to fetch nearby drivers');
    }
  },
);

export const acceptRideThunk = createAsyncThunk(
  'ride/accept',
  async (rideId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.acceptRide(rideId);
      return data.data as Ride;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to accept ride');
    }
  },
);

export const updateRideStatusThunk = createAsyncThunk(
  'ride/updateStatus',
  async ({ rideId, status }: { rideId: string; status: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.updateRideStatus(rideId, status);
      return data.data as Ride;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Status update failed');
    }
  },
);

const rideSlice = createSlice({
  name: 'ride',
  initialState,
  reducers: {
    setCurrentRide: (state, action: PayloadAction<Ride | null>) => {
      state.currentRide = action.payload;
    },
    updateCurrentRideStatus: (state, action: PayloadAction<{ rideId: string; status: string; data?: Partial<Ride> }>) => {
      if (state.currentRide?.id === action.payload.rideId) {
        state.currentRide = { ...state.currentRide, status: action.payload.status as any, ...action.payload.data };
      }
    },
    updateDriverLocation: (state, action: PayloadAction<Location>) => {
      state.driverLocation = action.payload;
    },
    setNearbyDrivers: (state, action: PayloadAction<NearbyDriver[]>) => {
      state.nearbyDrivers = action.payload;
    },
    clearCurrentRide: (state) => {
      state.currentRide = null;
      state.driverLocation = null;
      state.isSearching = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestRideThunk.pending, (state) => { state.isSearching = true; })
      .addCase(requestRideThunk.fulfilled, (state, action) => {
        state.currentRide = action.payload;
        state.isSearching = false;
      })
      .addCase(requestRideThunk.rejected, (state) => { state.isSearching = false; })
      .addCase(cancelRideThunk.fulfilled, (state) => {
        state.currentRide = null;
        state.driverLocation = null;
      })
      .addCase(fetchRideHistoryThunk.fulfilled, (state, action) => {
        state.rideHistory = action.payload;
      })
      .addCase(fetchNearbyDriversThunk.fulfilled, (state, action) => {
        state.nearbyDrivers = action.payload;
      })
      .addCase(acceptRideThunk.fulfilled, (state, action) => {
        state.currentRide = action.payload;
      })
      .addCase(updateRideStatusThunk.fulfilled, (state, action) => {
        state.currentRide = action.payload;
        if (['completed', 'cancelled_by_driver', 'cancelled_by_rider'].includes(action.payload.status)) {
          state.driverLocation = null;
        }
      });
  },
});

export const {
  setCurrentRide,
  updateCurrentRideStatus,
  updateDriverLocation,
  setNearbyDrivers,
  clearCurrentRide,
} = rideSlice.actions;

export default rideSlice.reducer;
