/**
 * Seed script — creates sample data for local development
 * Run with:  npx ts-node -r tsconfig-paths/register src/database/seed.ts
 */

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../.env.local') });
dotenv.config({ path: join(__dirname, '../../.env') });

import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { Driver, DriverStatus, VerificationStatus, VehicleType } from '../drivers/entities/driver.entity';
import { Ride, RideStatus } from '../rides/entities/ride.entity';
import { Payment, PaymentStatus, PaymentMethod } from '../payments/entities/payment.entity';
import { Rating, RatingType } from '../ratings/entities/rating.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'ridehail',
  password: process.env.DB_PASSWORD || 'ridehail_password',
  database: process.env.DB_NAME || 'ridehail_db',
  entities: [User, Driver, Ride, Payment, Rating],
  synchronize: true,
  logging: false,
});

async function seed() {
  console.log('🌱  Connecting to database...');
  await AppDataSource.initialize();
  console.log('✅  Connected!\n');

  const userRepo = AppDataSource.getRepository(User);
  const driverRepo = AppDataSource.getRepository(Driver);
  const rideRepo = AppDataSource.getRepository(Ride);
  const paymentRepo = AppDataSource.getRepository(Payment);
  const ratingRepo = AppDataSource.getRepository(Rating);

  const hash = (pw: string) => bcrypt.hash(pw, 12);

  // ── Clear existing seed data ──────────────────────────────────────────────
  console.log('🗑   Clearing old seed data...');
  await ratingRepo.delete({});
  await paymentRepo.delete({});
  await rideRepo.delete({});
  await driverRepo.delete({});
  await userRepo.delete({});

  // ── 1. Admin ──────────────────────────────────────────────────────────────
  console.log('👤  Creating admin...');
  const admin = userRepo.create({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@ridehail.com',
    phone: '+10000000000',
    passwordHash: await hash('Admin@123'),
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
  });
  await userRepo.save(admin);
  console.log('   admin@ridehail.com  /  Admin@123');

  // ── 2. Riders ─────────────────────────────────────────────────────────────
  console.log('👤  Creating riders...');
  const riderData = [
    { firstName: 'Alice', lastName: 'Johnson', email: 'alice@ridehail.com', phone: '+11111111111' },
    { firstName: 'Bob', lastName: 'Smith', email: 'bob@ridehail.com', phone: '+12222222222' },
    { firstName: 'Carol', lastName: 'Williams', email: 'carol@ridehail.com', phone: '+13333333333' },
  ];

  const riders: User[] = [];
  for (const rd of riderData) {
    const rider = userRepo.create({
      ...rd,
      passwordHash: await hash('Rider@123'),
      role: UserRole.RIDER,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      totalRides: Math.floor(Math.random() * 20),
      averageRating: 4.5 + Math.random() * 0.5,
    });
    riders.push(await userRepo.save(rider));
    console.log(`   ${rd.email}  /  Rider@123`);
  }

  // ── 3. Drivers ────────────────────────────────────────────────────────────
  console.log('🚗  Creating drivers...');
  const driverSeed = [
    {
      user: { firstName: 'David', lastName: 'Lee', email: 'david@ridehail.com', phone: '+14444444444' },
      vehicle: { make: 'Toyota', model: 'Camry', year: 2021, color: 'White', plate: 'ABC-1234', type: VehicleType.STANDARD },
      status: DriverStatus.ONLINE,
      lat: 37.7749, lng: -122.4194,
    },
    {
      user: { firstName: 'Eva', lastName: 'Martinez', email: 'eva@ridehail.com', phone: '+15555555555' },
      vehicle: { make: 'Honda', model: 'Accord', year: 2022, color: 'Black', plate: 'XYZ-5678', type: VehicleType.PREMIUM },
      status: DriverStatus.ONLINE,
      lat: 37.7849, lng: -122.4094,
    },
    {
      user: { firstName: 'Frank', lastName: 'Chen', email: 'frank@ridehail.com', phone: '+16666666666' },
      vehicle: { make: 'Ford', model: 'F-150', year: 2020, color: 'Blue', plate: 'DEF-9012', type: VehicleType.XL },
      status: DriverStatus.OFFLINE,
      lat: 37.7649, lng: -122.4294,
    },
    {
      user: { firstName: 'Grace', lastName: 'Kim', email: 'grace@ridehail.com', phone: '+17777777777' },
      vehicle: { make: 'Hyundai', model: 'Elantra', year: 2023, color: 'Silver', plate: 'GHI-3456', type: VehicleType.ECONOMY },
      status: DriverStatus.ONLINE,
      lat: 37.7699, lng: -122.4144,
    },
  ];

  const drivers: Driver[] = [];
  for (const ds of driverSeed) {
    const driverUser = userRepo.create({
      ...ds.user,
      passwordHash: await hash('Driver@123'),
      role: UserRole.DRIVER,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      totalRides: Math.floor(Math.random() * 150),
      averageRating: 4.3 + Math.random() * 0.7,
    });
    const savedUser = await userRepo.save(driverUser);

    const driver = driverRepo.create({
      userId: savedUser.id,
      vehicleMake: ds.vehicle.make,
      vehicleModel: ds.vehicle.model,
      vehicleYear: ds.vehicle.year,
      vehicleColor: ds.vehicle.color,
      vehiclePlate: ds.vehicle.plate,
      vehicleType: ds.vehicle.type,
      licenseNumber: `LIC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      licenseExpiry: new Date('2027-12-31'),
      status: ds.status,
      verificationStatus: VerificationStatus.APPROVED,
      currentLatitude: ds.lat,
      currentLongitude: ds.lng,
      locationUpdatedAt: new Date(),
      totalEarnings: Math.random() * 5000,
      totalTrips: Math.floor(Math.random() * 200),
      acceptedRides: Math.floor(Math.random() * 200),
      rejectedRides: Math.floor(Math.random() * 20),
      averageRating: 4.3 + Math.random() * 0.7,
    });
    drivers.push(await driverRepo.save(driver));
    console.log(`   ${ds.user.email}  /  Driver@123  [${ds.status}]`);
  }

  // ── 4. Pending driver (needs approval) ───────────────────────────────────
  console.log('⏳  Creating pending driver...');
  const pendingUser = userRepo.create({
    firstName: 'Henry',
    lastName: 'Brown',
    email: 'henry@ridehail.com',
    phone: '+18888888888',
    passwordHash: await hash('Driver@123'),
    role: UserRole.DRIVER,
    status: UserStatus.PENDING,
  });
  const savedPending = await userRepo.save(pendingUser);
  await driverRepo.save(driverRepo.create({
    userId: savedPending.id,
    vehicleMake: 'Chevrolet', vehicleModel: 'Malibu', vehicleYear: 2019,
    vehicleColor: 'Red', vehiclePlate: 'JKL-7890', vehicleType: VehicleType.STANDARD,
    licenseNumber: 'LIC-PENDING01', licenseExpiry: new Date('2026-06-30'),
    status: DriverStatus.OFFLINE, verificationStatus: VerificationStatus.PENDING,
  }));
  console.log('   henry@ridehail.com  /  Driver@123  [PENDING APPROVAL]');

  // ── 5. Sample completed rides ─────────────────────────────────────────────
  console.log('🚕  Creating sample completed rides...');
  const sampleRides = [
    {
      rider: riders[0], driver: drivers[0],
      pickup: { lat: 37.7749, lng: -122.4194, addr: '123 Market St, San Francisco, CA' },
      dest: { lat: 37.3382, lng: -121.8863, addr: '456 Technology Dr, San Jose, CA' },
      fare: 34.50,
    },
    {
      rider: riders[1], driver: drivers[1],
      pickup: { lat: 37.7850, lng: -122.4100, addr: '789 Mission St, San Francisco, CA' },
      dest: { lat: 37.7951, lng: -122.3978, addr: '321 Howard St, San Francisco, CA' },
      fare: 12.80,
    },
    {
      rider: riders[0], driver: drivers[2],
      pickup: { lat: 37.7600, lng: -122.4300, addr: '555 Valencia St, San Francisco, CA' },
      dest: { lat: 37.8044, lng: -122.2712, addr: '100 Broadway, Oakland, CA' },
      fare: 22.10,
    },
  ];

  for (const sr of sampleRides) {
    const completedAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const startedAt = new Date(completedAt.getTime() - 30 * 60 * 1000);

    const ride = rideRepo.create({
      riderId: sr.rider.id,
      driverId: sr.driver.id,
      pickupLatitude: sr.pickup.lat,
      pickupLongitude: sr.pickup.lng,
      pickupAddress: sr.pickup.addr,
      destinationLatitude: sr.dest.lat,
      destinationLongitude: sr.dest.lng,
      destinationAddress: sr.dest.addr,
      status: RideStatus.COMPLETED,
      requestedVehicleType: sr.driver.vehicleType,
      estimatedFare: sr.fare,
      finalFare: sr.fare,
      estimatedDistanceKm: sr.fare / 1.2,
      actualDistanceKm: sr.fare / 1.2,
      estimatedDurationMinutes: 25,
      actualDurationMinutes: 28,
      driverAssignedAt: new Date(startedAt.getTime() - 5 * 60 * 1000),
      tripStartedAt: startedAt,
      tripCompletedAt: completedAt,
    });
    const savedRide = await rideRepo.save(ride);

    // Payment
    const payment = paymentRepo.create({
      rideId: savedRide.id, riderId: sr.rider.id, driverId: sr.driver.id,
      amount: sr.fare, driverAmount: sr.fare * 0.8, platformFee: sr.fare * 0.2,
      currency: 'usd', status: PaymentStatus.COMPLETED, method: PaymentMethod.CARD,
      stripePaymentIntentId: `pi_seed_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    });
    await paymentRepo.save(payment);

    // Rating
    const rating = ratingRepo.create({
      rideId: savedRide.id,
      type: RatingType.RIDER_TO_DRIVER,
      ratedById: sr.rider.id,
      ratedUserId: sr.driver.userId,
      score: Math.floor(4 + Math.random() * 2),
      comment: 'Great ride, very smooth!',
      tags: ['on_time', 'clean_car'],
    });
    await ratingRepo.save(rating);
  }
  console.log(`   ${sampleRides.length} completed rides created`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n🎉  Seed complete!\n');
  console.log('─────────────────────────────────────────────────');
  console.log('  ACCOUNT          EMAIL                 PASSWORD');
  console.log('─────────────────────────────────────────────────');
  console.log('  Admin            admin@ridehail.com    Admin@123');
  console.log('  Rider 1          alice@ridehail.com    Rider@123');
  console.log('  Rider 2          bob@ridehail.com      Rider@123');
  console.log('  Driver (online)  david@ridehail.com    Driver@123');
  console.log('  Driver (online)  eva@ridehail.com      Driver@123');
  console.log('  Driver (offline) frank@ridehail.com    Driver@123');
  console.log('  Driver (pending) henry@ridehail.com    Driver@123');
  console.log('─────────────────────────────────────────────────');
  console.log('\n📖  Swagger UI → http://localhost:3000/api/docs');
  console.log('🖥️   Admin Panel → http://localhost:3001\n');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
