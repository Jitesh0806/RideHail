import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { CognitoService } from './cognito.service';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { Driver } from '../drivers/entities/driver.entity';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

const mockUserRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

const mockDriverRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn(),
});

const mockCognitoService = () => ({
  createUser: jest.fn().mockResolvedValue('cognito-id'),
});

const mockConfigService = () => ({
  get: jest.fn((key: string, def?: any) => def),
});

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: ReturnType<typeof mockUserRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepo },
        { provide: getRepositoryToken(Driver), useFactory: mockDriverRepo },
        { provide: JwtService, useFactory: mockJwtService },
        { provide: CognitoService, useFactory: mockCognitoService },
        { provide: ConfigService, useFactory: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should throw UnauthorizedException for invalid credentials', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(
        service.login({ email: 'test@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens on valid login', async () => {
      const hash = await bcrypt.hash('password123', 12);
      userRepo.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: hash,
        role: UserRole.RIDER,
        status: UserStatus.ACTIVE,
        firstName: 'John',
        lastName: 'Doe',
      });
      userRepo.update.mockResolvedValue({});

      const result = await service.login({
        email: 'test@test.com',
        password: 'password123',
      });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('registerRider', () => {
    it('should throw ConflictException if email/phone exists', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'existing' });
      await expect(
        service.registerRider({
          firstName: 'John',
          lastName: 'Doe',
          email: 'existing@test.com',
          phone: '+1234567890',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
