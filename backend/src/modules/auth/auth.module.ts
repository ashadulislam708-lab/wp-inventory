import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { TokenCleanupService } from './services/token-cleanup.service.js';
import { UserModule } from '../users/user.module.js';
import { RefreshToken } from './entities/refresh-token.entity.js';
import { envConfigService } from '../../config/env-config.service.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([RefreshToken]),
        UserModule,
        JwtModule.register({
            secret: envConfigService.getAuthJWTConfig().AUTH_JWT_SECRET,
            signOptions: {
                expiresIn: '1h',
            },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, TokenCleanupService],
    exports: [AuthService, JwtModule],
})
export class AuthModule {}
