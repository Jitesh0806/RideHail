// Demo data shown when backend is not running
export const MOCK_DASHBOARD = {
  totalUsers: 1284,
  totalDrivers: 342,
  activeDrivers: 87,
  totalRides: 9421,
  activeRides: 14,
  todayRides: 183,
  todayRevenue: 736.40,
};

export const MOCK_ACTIVE_RIDES = [
  {
    id: 'ride-001',
    riderId: 'u1',
    driverId: 'd1',
    rider: { firstName: 'Alice', lastName: 'Johnson', phone: '+1 555-0101' },
    driver: {
      user: { firstName: 'David', lastName: 'Lee' },
      vehiclePlate: 'ABC-1234',
      vehicleType: 'standard',
    },
    pickupAddress: '123 Market St, San Francisco, CA',
    destinationAddress: '456 Technology Dr, San Jose, CA',
    status: 'in_progress',
    estimatedFare: 34.50,
    createdAt: new Date(Date.now() - 18 * 60000).toISOString(),
  },
  {
    id: 'ride-002',
    riderId: 'u2',
    driverId: 'd2',
    rider: { firstName: 'Bob', lastName: 'Smith', phone: '+1 555-0102' },
    driver: {
      user: { firstName: 'Eva', lastName: 'Martinez' },
      vehiclePlate: 'XYZ-5678',
      vehicleType: 'premium',
    },
    pickupAddress: '789 Mission St, San Francisco, CA',
    destinationAddress: '321 Howard St, San Francisco, CA',
    status: 'driver_en_route',
    estimatedFare: 12.80,
    createdAt: new Date(Date.now() - 4 * 60000).toISOString(),
  },
  {
    id: 'ride-003',
    riderId: 'u3',
    driverId: null,
    rider: { firstName: 'Carol', lastName: 'Williams', phone: '+1 555-0103' },
    driver: null,
    pickupAddress: '555 Valencia St, San Francisco, CA',
    destinationAddress: '100 Broadway, Oakland, CA',
    status: 'searching',
    estimatedFare: 22.10,
    createdAt: new Date(Date.now() - 1 * 60000).toISOString(),
  },
];

export const MOCK_USERS = [
  { id: 'u1', firstName: 'Alice', lastName: 'Johnson', email: 'alice@ridehail.com', phone: '+1 555-0101', role: 'rider', status: 'active', averageRating: 4.8, totalRides: 34, createdAt: '2024-01-15T10:00:00Z' },
  { id: 'u2', firstName: 'Bob', lastName: 'Smith', email: 'bob@ridehail.com', phone: '+1 555-0102', role: 'rider', status: 'active', averageRating: 4.6, totalRides: 21, createdAt: '2024-02-20T10:00:00Z' },
  { id: 'u3', firstName: 'Carol', lastName: 'Williams', email: 'carol@ridehail.com', phone: '+1 555-0103', role: 'rider', status: 'active', averageRating: 4.9, totalRides: 58, createdAt: '2024-01-05T10:00:00Z' },
  { id: 'u4', firstName: 'Daniel', lastName: 'Brown', email: 'daniel@ridehail.com', phone: '+1 555-0104', role: 'rider', status: 'suspended', averageRating: 3.1, totalRides: 7, createdAt: '2024-03-10T10:00:00Z' },
  { id: 'u5', firstName: 'Emily', lastName: 'Davis', email: 'emily@ridehail.com', phone: '+1 555-0105', role: 'rider', status: 'active', averageRating: 4.7, totalRides: 12, createdAt: '2024-04-01T10:00:00Z' },
];

export const MOCK_PENDING_DRIVERS = [
  {
    id: 'drv-pending-1',
    userId: 'u-drv-1',
    user: { firstName: 'Henry', lastName: 'Brown', email: 'henry@ridehail.com', phone: '+1 555-0201' },
    vehicleMake: 'Chevrolet', vehicleModel: 'Malibu', vehicleColor: 'Red',
    vehiclePlate: 'JKL-7890', vehicleType: 'standard',
    licenseImageUrl: null, vehicleInsuranceUrl: null,
    verificationStatus: 'pending',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'drv-pending-2',
    userId: 'u-drv-2',
    user: { firstName: 'Irene', lastName: 'Wilson', email: 'irene@ridehail.com', phone: '+1 555-0202' },
    vehicleMake: 'Nissan', vehicleModel: 'Altima', vehicleColor: 'White',
    vehiclePlate: 'MNO-2345', vehicleType: 'economy',
    licenseImageUrl: null, vehicleInsuranceUrl: null,
    verificationStatus: 'pending',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const MOCK_DRIVERS = [
  { id: 'd1', firstName: 'David', lastName: 'Lee', email: 'david@ridehail.com', role: 'driver', status: 'active', driverStatus: 'online', verificationStatus: 'approved', averageRating: 4.9, totalRides: 187, createdAt: '2023-11-01T10:00:00Z' },
  { id: 'd2', firstName: 'Eva', lastName: 'Martinez', email: 'eva@ridehail.com', role: 'driver', status: 'active', driverStatus: 'online', verificationStatus: 'approved', averageRating: 4.7, totalRides: 124, createdAt: '2023-12-15T10:00:00Z' },
  { id: 'd3', firstName: 'Frank', lastName: 'Chen', email: 'frank@ridehail.com', role: 'driver', status: 'active', driverStatus: 'offline', verificationStatus: 'approved', averageRating: 4.5, totalRides: 93, createdAt: '2024-01-20T10:00:00Z' },
  { id: 'd4', firstName: 'Grace', lastName: 'Kim', email: 'grace@ridehail.com', role: 'driver', status: 'active', driverStatus: 'on_ride', verificationStatus: 'approved', averageRating: 4.8, totalRides: 211, createdAt: '2023-10-05T10:00:00Z' },
];

export const MOCK_ANALYTICS = {
  period: { startDate: '2024-01-01', endDate: '2024-01-07' },
  totalRides: 1243,
  completedRides: 1098,
  cancelledRides: 112,
  completionRate: 88.3,
  totalRevenue: 18640.50,
  platformRevenue: 3728.10,
  averageFare: 16.98,
  peakHours: {
    '7': 42, '8': 98, '9': 87, '10': 54, '11': 61, '12': 72,
    '13': 68, '14': 55, '15': 49, '16': 63, '17': 112, '18': 134,
    '19': 108, '20': 89, '21': 76, '22': 58, '23': 34,
  },
};
