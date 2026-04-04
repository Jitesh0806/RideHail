import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { StorageService } from '../locations/storage.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly storage: StorageService,
  ) {}

  async getProfile(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Prevent role/status changes through this endpoint
    delete updates.role;
    delete updates.status;
    delete updates.passwordHash;

    await this.userRepo.update(userId, updates);
    return this.userRepo.findOne({ where: { id: userId } });
  }

  async updateFcmToken(userId: string, fcmToken: string): Promise<void> {
    await this.userRepo.update(userId, { fcmToken });
  }

  async uploadProfilePicture(userId: string, file: Express.Multer.File): Promise<string> {
    const key = `profiles/${userId}/${Date.now()}-${file.originalname}`;
    const url = await this.storage.uploadFile(key, file.buffer, file.mimetype);
    await this.userRepo.update(userId, { profilePictureUrl: url });
    return url;
  }

  async findAll(page = 1, limit = 20) {
    const [users, total] = await this.userRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { users, total, page, limit };
  }
}
