import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RidesService } from './rides.service';
import { DriverMatchingService } from './driver-matching.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentsService } from '../payments/payments.service';
import { Ride, RideStatus } from './entities/ride.entity';
import { Driver } from '../drivers/entities/driver.entity';
import { User } from '../users/entities/user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  })),
});

describe('RidesService', () => {
  let service: RidesService;
  let rideRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RidesService,
        { provide: getRepositoryToken(Ride), useFactory: mockRepo },
        { provide: getRepositoryToken(Driver), useFactory: mockRepo },
        { provide: getRepositoryToken(User), useFactory: mockRepo },
        {
          provide: DriverMatchingService,
          useValue: {
            findNearbyDrivers: jest.fn().mockResolvedValue([]),
            calculateFare: jest.fn().mockReturnValue(12.5),
            getNextSearchRadius: jest.fn().mockReturnValue(null),
          },
        },
        {
          provide: NotificationsService,
          useValue: { sendPushNotification: jest.fn() },
        },
        {
          provide: PaymentsService,
          useValue: { createPaymentIntent: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<RidesService>(RidesService);
    rideRepo = module.get(getRepositoryToken(Ride));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRideById', () => {
    it('should throw NotFoundException if ride not found', async () => {
      rideRepo.findOne.mockResolvedValue(null);
      await expect(service.getRideById('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should return ride if found', async () => {
      const mockRide = { id: 'ride-1', status: RideStatus.COMPLETED };
      rideRepo.findOne.mockResolvedValue(mockRide);
      const result = await service.getRideById('ride-1');
      expect(result).toEqual(mockRide);
    });
  });

  describe('cancelRide', () => {
    it('should throw BadRequestException for completed ride', async () => {
      rideRepo.findOne.mockResolvedValue({ id: 'ride-1', status: RideStatus.COMPLETED });
      await expect(
        service.cancelRide('user-1', 'ride-1', 'rider_changed_mind' as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
