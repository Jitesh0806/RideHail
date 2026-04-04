import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum RatingType {
  RIDER_TO_DRIVER = 'rider_to_driver',
  DRIVER_TO_RIDER = 'driver_to_rider',
}

@Entity('ratings')
@Index(['rideId'])
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  rideId: string;

  @Column({ type: 'enum', enum: RatingType })
  type: RatingType;

  @ManyToOne(() => User, (user) => user.givenRatings)
  @JoinColumn()
  ratedBy: User;

  @Column()
  ratedById: string;

  @ManyToOne(() => User, (user) => user.receivedRatings)
  @JoinColumn()
  ratedUser: User;

  @Column()
  ratedUserId: string;

  @Column({ type: 'int' })
  score: number;  // 1-5

  @Column({ nullable: true })
  comment: string;

  @Column({ type: 'text', array: true, nullable: true })
  tags: string[];  // e.g. ['clean_car', 'professional', 'on_time']

  @CreateDateColumn()
  createdAt: Date;
}
