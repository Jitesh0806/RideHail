export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'rider' | 'driver' | 'admin';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  profilePictureUrl?: string;
  averageRating: number;
  totalRides: number;
}

export interface Driver {
  id: string;
  userId: string;
  user: User;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleColor: string;
  vehiclePlate: string;
  vehicleType: VehicleType;
  status: DriverStatus;
  verificationStatus: VerificationStatus;
  currentLatitude?: number;
  currentLongitude?: number;
  totalEarnings: number;
  averageRating: number;
  totalTrips: number;
}

export interface Ride {
  id: string;
  riderId: string;
  rider?: User;
  driverId?: string;
  driver?: Driver;
  pickupLatitude: number;
  pickupLongitude: number;
  pickupAddress: string;
  destinationLatitude: number;
  destinationLongitude: number;
  destinationAddress: string;
  status: RideStatus;
  requestedVehicleType: VehicleType;
  estimatedFare: number;
  finalFare?: number;
  estimatedDistanceKm: number;
  estimatedDurationMinutes?: number;
  driverAssignedAt?: string;
  tripStartedAt?: string;
  tripCompletedAt?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  rideId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  createdAt: string;
}

export interface Rating {
  id: string;
  rideId: string;
  score: number;
  comment?: string;
  tags?: string[];
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export type VehicleType = 'economy' | 'standard' | 'premium' | 'xl';
export type DriverStatus = 'offline' | 'online' | 'on_ride' | 'suspended';
export type VerificationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';
export type RideStatus =
  | 'searching'
  | 'driver_assigned'
  | 'driver_en_route'
  | 'driver_arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled_by_rider'
  | 'cancelled_by_driver'
  | 'no_driver_found';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'card' | 'wallet' | 'cash';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface RideState {
  currentRide: Ride | null;
  rideHistory: Ride[];
  isSearching: boolean;
  nearbyDrivers: NearbyDriver[];
  driverLocation: Location | null;
}

export interface NearbyDriver {
  driverId: string;
  latitude: number;
  longitude: number;
  vehicleType: VehicleType;
  distanceKm: number;
  estimatedMinutes: number;
}
