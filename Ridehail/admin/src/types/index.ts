export interface DashboardStats {
  totalUsers: number;
  totalDrivers: number;
  activeDrivers: number;
  totalRides: number;
  activeRides: number;
  todayRides: number;
  todayRevenue: number;
}

export interface Ride {
  id: string;
  riderId: string;
  rider?: User;
  driverId?: string;
  driver?: Driver;
  pickupAddress: string;
  destinationAddress: string;
  status: string;
  estimatedFare: number;
  finalFare?: number;
  createdAt: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  averageRating: number;
  totalRides: number;
  createdAt: string;
}

export interface Driver {
  id: string;
  userId: string;
  user: User;
  vehicleMake: string;
  vehicleModel: string;
  vehicleColor: string;
  vehiclePlate: string;
  vehicleType: string;
  status: string;
  verificationStatus: string;
  totalTrips: number;
  totalEarnings: number;
  averageRating: number;
  licenseImageUrl?: string;
  vehicleInsuranceUrl?: string;
  createdAt: string;
}

export interface Analytics {
  period: { startDate: string; endDate: string };
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  completionRate: number;
  totalRevenue: number;
  platformRevenue: number;
  averageFare: number;
  peakHours: Record<string, number>;
}
