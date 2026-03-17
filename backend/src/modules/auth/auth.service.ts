import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { UserRepository } from '../users/user.repository.js';
import { RefreshToken } from './entities/refresh-token.entity.js';
import { LoginDto } from './dtos/login.dto.js';
import { PasswordUtil } from '../../core/utils/password.util.js';
import { IJwtPayload } from '../../shared/interfaces/jwt-payload.js';

@Injectable()
export class AuthService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly jwtService: JwtService,
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,
    ) {}

    /**
     * Login with email and password
     * Returns access token (1h) + refresh token (7d) + user info
     */
    async login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: { id: string; email: string; name: string; role: string };
    }> {
        const user = await this.userRepository.findByEmailWithPassword(
            dto.email,
        );

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        if (!user.isActive) {
            throw new UnauthorizedException(
                'Account is deactivated. Contact administrator.',
            );
        }

        const isPasswordValid = await PasswordUtil.compare(
            dto.password,
            user.password,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const payload: IJwtPayload = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
        };

        const accessToken = this.jwtService.sign(payload, {
            expiresIn: '1h',
        });

        const refreshTokenValue = this.jwtService.sign(
            { id: user.id, type: 'refresh' },
            { expiresIn: '7d' },
        );

        // Store refresh token in database
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const refreshTokenEntity = this.refreshTokenRepository.create({
            userId: user.id,
            token: refreshTokenValue,
            expiresAt,
            isRevoked: false,
        });

        await this.refreshTokenRepository.save(refreshTokenEntity);

        return {
            accessToken,
            refreshToken: refreshTokenValue,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        };
    }

    /**
     * Refresh tokens - exchange valid refresh token for new token pair
     */
    async refresh(
        refreshToken: string,
    ): Promise<{ accessToken: string; refreshToken: string }> {
        // Verify the JWT structure
        let decoded: { id: string; type: string };
        try {
            decoded = this.jwtService.verify(refreshToken);
        } catch {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        if (decoded.type !== 'refresh') {
            throw new UnauthorizedException('Invalid token type');
        }

        // Check if refresh token exists in DB and is not revoked
        const storedToken = await this.refreshTokenRepository.findOne({
            where: { token: refreshToken, isRevoked: false },
        });

        if (!storedToken) {
            throw new UnauthorizedException(
                'Refresh token not found or already revoked',
            );
        }

        if (storedToken.expiresAt < new Date()) {
            throw new UnauthorizedException('Refresh token has expired');
        }

        // Get the user
        const user = await this.userRepository.findById(decoded.id);
        if (!user || !user.isActive) {
            throw new UnauthorizedException('User not found or deactivated');
        }

        // Revoke the old refresh token
        storedToken.isRevoked = true;
        await this.refreshTokenRepository.save(storedToken);

        // Generate new token pair
        const payload: IJwtPayload = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
        };

        const newAccessToken = this.jwtService.sign(payload, {
            expiresIn: '1h',
        });

        const newRefreshTokenValue = this.jwtService.sign(
            { id: user.id, type: 'refresh' },
            { expiresIn: '7d' },
        );

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const newRefreshTokenEntity = this.refreshTokenRepository.create({
            userId: user.id,
            token: newRefreshTokenValue,
            expiresAt,
            isRevoked: false,
        });

        await this.refreshTokenRepository.save(newRefreshTokenEntity);

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshTokenValue,
        };
    }

    /**
     * Logout - revoke the refresh token
     */
    async logout(refreshToken: string): Promise<{ message: string }> {
        const storedToken = await this.refreshTokenRepository.findOne({
            where: { token: refreshToken, isRevoked: false },
        });

        if (storedToken) {
            storedToken.isRevoked = true;
            await this.refreshTokenRepository.save(storedToken);
        }

        return { message: 'Logged out successfully' };
    }

    /**
     * Get current authenticated user
     */
    async getMe(payload: IJwtPayload): Promise<{
        id: string;
        email: string;
        name: string;
        role: string;
    }> {
        const user = await this.userRepository.findById(payload.id);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        };
    }

    /**
     * Cleanup expired refresh tokens (can be called by a cron job)
     */
    async cleanupExpiredTokens(): Promise<void> {
        await this.refreshTokenRepository.delete({
            expiresAt: LessThan(new Date()),
        });
    }
}
