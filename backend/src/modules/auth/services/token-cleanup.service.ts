import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity.js';

@Injectable()
export class TokenCleanupService {
    private readonly logger = new Logger(TokenCleanupService.name);

    constructor(
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,
    ) {}

    /**
     * Clean up expired refresh tokens daily at 3:00 AM
     * Hard delete is acceptable for tokens (session data, not business data)
     * RefreshToken entity does not have @DeleteDateColumn
     */
    @Cron('0 3 * * *', {
        name: 'cleanup-expired-tokens',
        timeZone: 'UTC',
    })
    async handleExpiredTokenCleanup(): Promise<void> {
        this.logger.log('Starting expired refresh token cleanup...');

        try {
            const result = await this.refreshTokenRepository.delete({
                expiresAt: LessThan(new Date()),
            });

            const deletedCount = result.affected || 0;
            this.logger.log(
                `Expired token cleanup completed: ${deletedCount} tokens removed`,
            );
        } catch (error: any) {
            this.logger.error(
                `Failed to clean up expired tokens: ${error.message}`,
                error.stack,
            );
        }
    }
}
