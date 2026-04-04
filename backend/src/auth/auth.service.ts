import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { Driver, VerificationStatus } from '../drivers/entities/driver.entity';
import { CognitoService } from './cognito.service';
import { RegisterRiderDto } from './dto/register-rider.dto';
import { RegisterDriverDto } from './dto/register-driver.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Driver) private readonly driverRepo: Repository<Driver>,
    private readonly jwtService: JwtService,
    private readonly cognitoService: CognitoService,
    private readonly config: ConfigService,
  ) {}

  async registerRider(dto: RegisterRiderDto) {
    const existing = await this.userRepo.findOne({
      where: [{ email: dto.email }, { phone: dto.phone }],
    });
    if (existing) {
      throw new ConflictException('Email or phone already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      role: UserRole.RIDER,
      status: UserStatus.ACTIVE,
    });

    await this.userRepo.save(user);

    // Register with Cognito (optional - for MFA/social login)
    try {
      const cognitoId = await this.cognitoService.createUser(
        dto.email,
        dto.password,
        dto.firstName,
        dto.lastName,
      );
      await this.userRepo.update(user.id, { cognitoUserId: cognitoId });
    } catch (err) {
      // Cognito registration failure is non-fatal in dev
      console.warn('Cognito registration failed:', err.message);
    }

    return this.generateTokens(user);
  }

  async registerDriver(dto: RegisterDriverDto) {
    const existing = await this.userRepo.findOne({
      where: [{ email: dto.email }, { phone: dto.phone }],
    });
    if (existing) {
      throw new ConflictException('Email or phone already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      role: UserRole.DRIVER,
      status: UserStatus.PENDING,  // Pending until license verified
    });
    await this.userRepo.save(user);

    // Create driver profile
    const driver = this.driverRepo.create({
      userId: user.id,
      vehicleMake: dto.vehicleMake,
      vehicleModel: dto.vehicleModel,
      vehicleYear: dto.vehicleYear,
      vehicleColor: dto.vehicleColor,
      vehiclePlate: dto.vehiclePlate,
      vehicleType: dto.vehicleType,
      licenseNumber: dto.licenseNumber,
      licenseExpiry: dto.licenseExpiry,
      verificationStatus: VerificationStatus.PENDING,
    });
    await this.driverRepo.save(driver);

    const tokens = this.generateTokens(user);
    return {
      ...tokens,
      message: 'Registration successful. Your account is pending verification.',
      verificationStatus: VerificationStatus.PENDING,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      select: ['id', 'email', 'phone', 'passwordHash', 'role', 'status', 'firstName', 'lastName'],
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account suspended. Contact support.');
    }

    await this.userRepo.update(user.id, { lastLoginAt: new Date() });
    return this.generateTokens(user);
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException();
    }
    return user;
  }

  private generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '30d'),
      }),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}
