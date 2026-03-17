import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Type } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../../src/core/guards/jwt-auth.guard';
import { JwtStrategy } from '../../src/core/guards/jwt.strategy';
import { TEST_JWT_SECRET } from './auth.helper';

export interface TestAppContext {
    app: INestApplication;
    module: TestingModule;
}

export interface CreateTestAppOptions {
    controllers: Type<any>[];
    providers?: any[];
}

/**
 * Creates a NestJS test application with:
 * - Real JWT auth guard (checks @Public() decorator)
 * - Real validation pipe (class-validator)
 * - Global /api prefix
 * - Mocked services (provided by caller)
 */
export async function createTestApp(
    options: CreateTestAppOptions,
): Promise<TestAppContext> {
    // Set the JWT secret env var so JwtStrategy picks it up
    process.env.AUTH_JWT_SECRET = TEST_JWT_SECRET;

    const module = await Test.createTestingModule({
        imports: [
            PassportModule.register({ defaultStrategy: 'jwt' }),
            JwtModule.register({
                secret: TEST_JWT_SECRET,
                signOptions: { expiresIn: '1h' },
            }),
        ],
        controllers: options.controllers,
        providers: [
            Reflector,
            JwtStrategy,
            {
                provide: APP_GUARD,
                useClass: JwtAuthGuard,
            },
            ...(options.providers || []),
        ],
    }).compile();

    const app = module.createNestApplication();

    app.setGlobalPrefix('api');

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            forbidUnknownValues: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    await app.init();

    return { app, module };
}

export async function closeTestApp(context: TestAppContext): Promise<void> {
    await context.app.close();
}
