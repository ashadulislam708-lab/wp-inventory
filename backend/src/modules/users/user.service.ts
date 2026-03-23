import {
    Injectable,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { PasswordUtil } from '../../core/utils/password.util.js';
import { User } from './user.entity.js';
import { UserRepository } from './user.repository.js';
import { CreateUserDto } from './dtos/create-user.dto.js';
import { UpdateUserDto } from './dtos/update-user.dto.js';

@Injectable()
export class UserService {
    constructor(private readonly userRepository: UserRepository) {}

    /**
     * Get all users
     */
    async getAllUsers(): Promise<User[]> {
        return this.userRepository.findAll();
    }

    /**
     * Get user by ID
     */
    async getUserById(id: string): Promise<User> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }

    /**
     * Create a new user (admin only)
     */
    async createUser(dto: CreateUserDto): Promise<User> {
        const existingUser = await this.userRepository.findByEmail(dto.email);
        if (existingUser) {
            throw new ConflictException(
                `User with email ${dto.email} already exists`,
            );
        }

        const hashedPassword = await PasswordUtil.hash(dto.password);

        return this.userRepository.create({
            ...dto,
            password: hashedPassword,
        });
    }

    /**
     * Update user details (admin only) -- includes password reset
     */
    async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
        const user = await this.getUserById(id);

        if (dto.email && dto.email !== user.email) {
            const existing = await this.userRepository.findByEmail(dto.email);
            if (existing) {
                throw new ConflictException(
                    `User with email ${dto.email} already exists`,
                );
            }
        }

        const updateData: Partial<User> = { ...dto } as Partial<User>;
        if (dto.password) {
            updateData.password = await PasswordUtil.hash(dto.password);
        }

        const updated = await this.userRepository.update(id, updateData as any);
        if (!updated) {
            return this.getUserById(id);
        }
        return updated;
    }

    /**
     * Deactivate user (soft -- set isActive=false)
     * NEVER hard delete users
     */
    async deactivateUser(id: string): Promise<{ message: string }> {
        const user = await this.getUserById(id);
        await this.userRepository.update(id, { isActive: false } as any);
        return { message: `User ${user.email} has been deactivated` };
    }

    /**
     * Find user by email
     */
    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findByEmail(email);
    }
}
