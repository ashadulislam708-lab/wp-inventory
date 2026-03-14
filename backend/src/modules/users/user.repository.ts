import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from 'src/core/base';
import { User } from './user.entity';
import { ActiveStatusEnum } from '@shared/enums';

@Injectable()
export class UserRepository extends BaseRepository<User> {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {
        super(userRepository);
    }

    /**
     * Find user by email
     */
    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    /**
     * Find active users
     */
    async findActiveUsers(): Promise<User[]> {
        return this.userRepository.find({
            where: { isActive: ActiveStatusEnum.ACTIVE },
        });
    }
}
