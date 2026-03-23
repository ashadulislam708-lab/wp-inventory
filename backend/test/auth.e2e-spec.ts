import request from 'supertest';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import {
    createTestApp,
    closeTestApp,
    TestAppContext,
} from './helpers/test-app.factory';
import { testAdmin, authHeader } from './helpers/auth.helper';

const mockAuthService = {
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    getMe: jest.fn(),
};

describe('AuthController (e2e)', () => {
    let ctx: TestAppContext;
    let server: any;

    beforeAll(async () => {
        ctx = await createTestApp({
            controllers: [AuthController],
            providers: [{ provide: AuthService, useValue: mockAuthService }],
        });
        server = ctx.app.getHttpServer();
    });

    afterAll(async () => {
        await closeTestApp(ctx);
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    // ---------------------------------------------------------------
    // POST /api/auth/login (public, @HttpCode(200))
    // ---------------------------------------------------------------
    describe('POST /api/auth/login', () => {
        const url = '/api/auth/login';
        const validBody = {
            email: 'admin@glamlavish.test',
            password: 'Secret123!',
        };

        it('should login with valid credentials', async () => {
            const loginResponse = {
                accessToken: 'access-jwt',
                refreshToken: 'refresh-jwt',
                user: {
                    id: testAdmin.id,
                    email: testAdmin.email,
                    name: testAdmin.name,
                    role: testAdmin.role,
                },
            };
            mockAuthService.login.mockResolvedValue(loginResponse);

            const res = await request(server)
                .post(url)
                .send(validBody)
                .expect(200);

            expect(res.body).toEqual(loginResponse);
            expect(mockAuthService.login).toHaveBeenCalledWith(validBody);
        });

        it('should return 400 for missing email', async () => {
            await request(server)
                .post(url)
                .send({ password: 'Secret123!' })
                .expect(400);
        });

        it('should return 400 for missing password', async () => {
            await request(server)
                .post(url)
                .send({ email: 'admin@glamlavish.test' })
                .expect(400);
        });

        it('should return 401 for invalid credentials', async () => {
            mockAuthService.login.mockRejectedValue(
                new UnauthorizedException('Invalid credentials'),
            );

            await request(server).post(url).send(validBody).expect(401);
        });
    });

    // ---------------------------------------------------------------
    // POST /api/auth/refresh (public, @HttpCode(200))
    // Controller calls: authService.refresh(dto.refreshToken)
    // ---------------------------------------------------------------
    describe('POST /api/auth/refresh', () => {
        const url = '/api/auth/refresh';
        const validToken = 'some-valid-refresh-token-string';

        it('should refresh token with valid refreshToken', async () => {
            const refreshResponse = {
                accessToken: 'new-access-jwt',
                refreshToken: 'new-refresh-jwt',
            };
            mockAuthService.refresh.mockResolvedValue(refreshResponse);

            const res = await request(server)
                .post(url)
                .send({ refreshToken: validToken })
                .expect(200);

            expect(res.body).toEqual(refreshResponse);
            // Controller extracts dto.refreshToken and passes the string
            expect(mockAuthService.refresh).toHaveBeenCalledWith(validToken);
        });

        it('should return 400 for missing refreshToken', async () => {
            await request(server).post(url).send({}).expect(400);
        });

        it('should return 400 for empty refreshToken', async () => {
            await request(server)
                .post(url)
                .send({ refreshToken: '' })
                .expect(400);
        });

        it('should return 401 for expired or revoked token', async () => {
            mockAuthService.refresh.mockRejectedValue(
                new UnauthorizedException('Token expired or revoked'),
            );

            await request(server)
                .post(url)
                .send({ refreshToken: validToken })
                .expect(401);
        });
    });

    // ---------------------------------------------------------------
    // POST /api/auth/logout (protected, @HttpCode(200))
    // Controller calls: authService.logout(dto.refreshToken)
    // ---------------------------------------------------------------
    describe('POST /api/auth/logout', () => {
        const url = '/api/auth/logout';
        const validToken = 'some-valid-refresh-token-string';

        it('should logout with valid auth token and refreshToken', async () => {
            mockAuthService.logout.mockResolvedValue({
                message: 'Logged out successfully',
            });

            const res = await request(server)
                .post(url)
                .set(authHeader(testAdmin))
                .send({ refreshToken: validToken })
                .expect(200);

            expect(res.body).toEqual({ message: 'Logged out successfully' });
            // Controller passes dto.refreshToken as a string
            expect(mockAuthService.logout).toHaveBeenCalledWith(validToken);
        });

        it('should return 401 without auth token', async () => {
            await request(server)
                .post(url)
                .send({ refreshToken: validToken })
                .expect(401);
        });

        it('should return 400 for missing refreshToken in body', async () => {
            await request(server)
                .post(url)
                .set(authHeader(testAdmin))
                .send({})
                .expect(400);
        });
    });

    // ---------------------------------------------------------------
    // GET /api/auth/me (protected)
    // Controller calls: authService.getMe(user) — full JWT payload
    // ---------------------------------------------------------------
    describe('GET /api/auth/me', () => {
        const url = '/api/auth/me';

        it('should return current user profile', async () => {
            const meResponse = {
                id: testAdmin.id,
                email: testAdmin.email,
                name: testAdmin.name,
                role: testAdmin.role,
            };
            mockAuthService.getMe.mockResolvedValue(meResponse);

            const res = await request(server)
                .get(url)
                .set(authHeader(testAdmin))
                .expect(200);

            expect(res.body).toEqual(meResponse);
            // Controller passes the full user object from @CurrentUser()
            expect(mockAuthService.getMe).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: testAdmin.id,
                    email: testAdmin.email,
                    role: testAdmin.role,
                }),
            );
        });

        it('should return 401 without auth token', async () => {
            await request(server).get(url).expect(401);
        });
    });
});
