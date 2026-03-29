import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../services/api';

interface Location { latitude: number; longitude: number; address?: string; }
interface Driver { id: string; name: string; rating: number; vehicle: string; plate: string; latitude: number; longitude: number; }

interface Ride {
  id: string;
  status: string;
  pickupLocation: Location;
  dropoffLocation: Location;
  driver?: Driver;
  fare?: number;
  distance?: number;
  duration?: number;
  createdAt: string;
}

interface RideState {
  currentRide: Ride | null;
  rideHistory: Ride[];
  nearbyDrivers: Driver[];
  loading: boolean;
  searching: boolean;
}

const MOCK_HISTORY: Ride[] = [
  { id: 'r1', status: 'completed', pickupLocation: { latitude: 37.7749, longitude: -122.4194, address: '123 Market St' }, dropoffLocation: { latitude: 37.7900, longitude: -122.4000, address: '456 Castro St' }, fare: 14.50, distance: 3.2, duration: 12, createdAt: new Date(Date.now() - 86400000).toISOString(), driver: { id: 'd1', name: 'David Chen', rating: 4.9, vehicle: 'Toyota Camry', plate: 'ABC123', latitude: 37.7749, longitude: -122.4194 } },
  { id: 'r2', status: 'completed', pickupLocation: { latitude: 37.7800, longitude: -122.4100, address: 'Union Square' }, dropoffLocation: { latitude: 37.7600, longitude: -122.4400, address: 'Mission District' }, fare: 22.80, distance: 5.1, duration: 18, createdAt: new Date(Date.now() - 172800000).toISOString(), driver: { id: 'd2', name: 'Eva Martinez', rating: 4.7, vehicle: 'Honda Accord', plate: 'XYZ789', latitude: 37.7800, longitude: -122.4100 } },
  { id: 'r3', status: 'cancelled', pickupLocation: { latitude: 37.7850, longitude: -122.4050, address: 'Fisherman\'s Wharf' }, dropoffLocation: { latitude: 37.7700, longitude: -122.4200, address: 'Haight-Ashbury' }, fare: 0, distance: 0, duration: 0, createdAt: new Date(Date.now() - 259200000).toISOString() },
];

const MOCK_NEARBY: Driver[] = [
  { id: 'd1', name: 'David Chen', rating: 4.9, vehicle: 'Toyota Camry', plate: 'ABC123', latitude: 37.7760, longitude: -122.4180 },
  { id: 'd2', name: 'Eva Martinez', rating: 4.7, vehicle: 'Honda Accord', plate: 'XYZ789', latitude: 37.7740, longitude: -122.4210 },
  { id: 'd3', name: 'Frank Liu', rating: 4.8, vehicle: 'Tesla Model 3', plate: 'EV0001', latitude: 37.7780, longitude: -122.4160 },
];

export const requestRideThunk = createAsyncThunk('ride/request', async (payload: any, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/rides/request', payload);
    return data.data;
  } catch {
    // Demo: simulate a matched ride after 2s
    await new Promise(r => setTimeout(r, 2000));
    return {
      id: 'demo-' + Date.now(), status: 'driver_en_route',
      pickupLocation: payload.pickupLocation, dropoffLocation: payload.dropoffLocation,
      fare: Math.round(Math.random() * 15 + 8), distance: 3.5, duration: 14,
      createdAt: new Date().toISOString(),
      driver: MOCK_NEARBY[0],
    };
  }
});

export const cancelRideThunk = createAsyncThunk('ride/cancel', async (rideId: string) => {
  try { await api.post(`/rides/${rideId}/cancel`); } catch {}
  return rideId;
});

export const fetchRideHistoryThunk = createAsyncThunk('ride/history', async () => {
  try {
    const { data } = await api.get('/rides/history');
    return data.data.rides;
  } catch {
    return MOCK_HISTORY;
  }
});

export const fetchNearbyDriversThunk = createAsyncThunk('ride/nearby', async (coords: { latitude: number; longitude: number }) => {
  try {
    const { data } = await api.get(`/rides/nearby-drivers?lat=${coords.latitude}&lng=${coords.longitude}`);
    return data.data;
  } catch {
    return MOCK_NEARBY.map(d => ({ ...d, latitude: coords.latitude + (Math.random() - 0.5) * 0.01, longitude: coords.longitude + (Math.random() - 0.5) * 0.01 }));
  }
});

const rideSlice = createSlice({
  name: 'ride',
  initialState: { currentRide: null, rideHistory: [], nearbyDrivers: [], loading: false, searching: false } as RideState,
  reducers: {
    updateDriverLocation(state, action: PayloadAction<{ driverId: string; latitude: number; longitude: number }>) {
      const d = state.nearbyDrivers.find(dr => dr.id === action.payload.driverId);
      if (d) { d.latitude = action.payload.latitude; d.longitude = action.payload.longitude; }
      if (state.currentRide?.driver?.id === action.payload.driverId) {
        state.currentRide.driver!.latitude = action.payload.latitude;
        state.currentRide.driver!.longitude = action.payload.longitude;
      }
    },
    setRideStatus(state, action: PayloadAction<string>) {
      if (state.currentRide) state.currentRide.status = action.payload;
    },
    clearCurrentRide(state) { state.currentRide = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestRideThunk.pending, (s) => { s.searching = true; })
      .addCase(requestRideThunk.fulfilled, (s, a) => { s.currentRide = a.payload; s.searching = false; })
      .addCase(requestRideThunk.rejected, (s) => { s.searching = false; })
      .addCase(cancelRideThunk.fulfilled, (s) => { s.currentRide = null; })
      .addCase(fetchRideHistoryThunk.fulfilled, (s, a) => { s.rideHistory = a.payload; })
      .addCase(fetchNearbyDriversThunk.fulfilled, (s, a) => { s.nearbyDrivers = a.payload; });
  },
});

export const { updateDriverLocation, setRideStatus, clearCurrentRide } = rideSlice.actions;
export default rideSlice.reducer;
