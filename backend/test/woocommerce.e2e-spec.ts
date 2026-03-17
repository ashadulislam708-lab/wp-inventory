import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { WooCommerceController } from '../src/modules/woocommerce/controllers/woocommerce.controller';
import { WooCommerceService } from '../src/modules/woocommerce/services/woocommerce.service';
import { WcWebhookGuard } from '../src/core/guards/wc-webhook.guard';
import { RolesGuard } from '../src/core/guards/roles.guard';
import { JwtAuthGuard } from '../src/core/guards/jwt-auth.guard';
import { JwtStrategy } from '../src/core/guards/jwt.strategy';
import {
    testAdmin,
    testStaff,
    authHeader,
    TEST_JWT_SECRET,
} from './helpers/auth.helper';

const mockWooCommerceService = {
    handleProductWebhook: jest.fn().mockResolvedValue({ success: true }),
    handleOrderWebhook: jest.fn().mockResolvedValue({ success: true }),
    importProducts: jest.fn().mockResolvedValue({ imported: 10 }),
    syncProducts: jest.fn().mockResolvedValue({ synced: 10 }),
    syncOrders: jest.fn().mockResolvedValue({ synced: 5 }),
    getSyncLogs: jest.fn().mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 25, totalPages: 0 },
    }),
};

describe('WooCommerceController (e2e)', () => {
    let app: INestApplication;
    let server: any;

    beforeAll(async () => {
        process.env.AUTH_JWT_SECRET = TEST_JWT_SECRET;

        const module: TestingModule = await Test.createTestingModule({
            imports: [
                PassportModule.register({ defaultStrategy: 'jwt' }),
                JwtModule.register({
                    secret: TEST_JWT_SECRET,
                    signOptions: { expiresIn: '1h' },
                }),
            ],
            controllers: [WooCommerceController],
            providers: [
                Reflector,
                JwtStrategy,
                {
                    provide: APP_GUARD,
                    useClass: JwtAuthGuard,
                },
                RolesGuard,
                {
                    provide: WooCommerceService,
                    useValue: mockWooCommerceService,
                },
            ],
        })
            .overrideGuard(WcWebhookGuard)
            .useValue({ canActivate: () => true })
            .compile();

        app = module.createNestApplication();
        app.setGlobalPrefix('api');
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                forbidUnknownValues: true,
                transform: true,
                transformOptions: { enableImplicitConversion: true },
            }),
        );
        await app.init();
        server = app.getHttpServer();
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ---------------------------------------------------------------
    // POST /api/woocommerce/webhook/product (public, WcWebhookGuard)
    // ---------------------------------------------------------------
    describe('POST /api/woocommerce/webhook/product', () => {
        const url = '/api/woocommerce/webhook/product';

        it('should accept product webhook without auth token (public endpoint)', async () => {
            const webhookBody = {
                id: 123,
                name: 'Test Product',
                status: 'publish',
                sku: 'TP-001',
            };

            const res = await request(server)
                .post(url)
                .send(webhookBody)
                .expect(200);

            expect(res.body).toEqual({ success: true });
            expect(
                mockWooCommerceService.handleProductWebhook,
            ).toHaveBeenCalledTimes(1);
        });

        it('should also work with auth token', async () => {
            const webhookBody = { id: 456, name: 'Another Product' };

            await request(server)
                .post(url)
                .set(authHeader(testAdmin))
                .send(webhookBody)
                .expect(200);

            expect(
                mockWooCommerceService.handleProductWebhook,
            ).toHaveBeenCalledTimes(1);
        });
    });

    // ---------------------------------------------------------------
    // POST /api/woocommerce/webhook/order (public, WcWebhookGuard)
    // ---------------------------------------------------------------
    describe('POST /api/woocommerce/webhook/order', () => {
        const url = '/api/woocommerce/webhook/order';

        it('should accept order webhook without auth token (public endpoint)', async () => {
            const webhookBody = {
                id: 789,
                status: 'processing',
                total: '1500.00',
            };

            const res = await request(server)
                .post(url)
                .send(webhookBody)
                .expect(200);

            expect(res.body).toEqual({ success: true });
            expect(
                mockWooCommerceService.handleOrderWebhook,
            ).toHaveBeenCalledTimes(1);
        });

        it('should also work with auth token', async () => {
            const webhookBody = { id: 1000, status: 'completed' };

            await request(server)
                .post(url)
                .set(authHeader(testAdmin))
                .send(webhookBody)
                .expect(200);

            expect(
                mockWooCommerceService.handleOrderWebhook,
            ).toHaveBeenCalledTimes(1);
        });
    });

    // ---------------------------------------------------------------
    // POST /api/woocommerce/import/products (admin only)
    // ---------------------------------------------------------------
    describe('POST /api/woocommerce/import/products', () => {
        const url = '/api/woocommerce/import/products';

        it('should import products as admin', async () => {
            const res = await request(server)
                .post(url)
                .set(authHeader(testAdmin))
                .expect(200);

            expect(res.body).toEqual({ imported: 10 });
            expect(mockWooCommerceService.importProducts).toHaveBeenCalledTimes(
                1,
            );
        });

        it('should return 403 as staff', async () => {
            await request(server)
                .post(url)
                .set(authHeader(testStaff))
                .expect(403);

            expect(
                mockWooCommerceService.importProducts,
            ).not.toHaveBeenCalled();
        });

        it('should return 401 without auth token', async () => {
            await request(server).post(url).expect(401);

            expect(
                mockWooCommerceService.importProducts,
            ).not.toHaveBeenCalled();
        });
    });

    // ---------------------------------------------------------------
    // POST /api/woocommerce/sync/products (admin only)
    // ---------------------------------------------------------------
    describe('POST /api/woocommerce/sync/products', () => {
        const url = '/api/woocommerce/sync/products';

        it('should sync products as admin', async () => {
            const res = await request(server)
                .post(url)
                .set(authHeader(testAdmin))
                .expect(200);

            expect(res.body).toEqual({ synced: 10 });
            expect(mockWooCommerceService.syncProducts).toHaveBeenCalledTimes(
                1,
            );
        });

        it('should return 403 as staff', async () => {
            await request(server)
                .post(url)
                .set(authHeader(testStaff))
                .expect(403);

            expect(mockWooCommerceService.syncProducts).not.toHaveBeenCalled();
        });

        it('should return 401 without auth token', async () => {
            await request(server).post(url).expect(401);

            expect(mockWooCommerceService.syncProducts).not.toHaveBeenCalled();
        });
    });

    // ---------------------------------------------------------------
    // POST /api/woocommerce/sync/orders (admin only)
    // ---------------------------------------------------------------
    describe('POST /api/woocommerce/sync/orders', () => {
        const url = '/api/woocommerce/sync/orders';

        it('should sync orders as admin', async () => {
            const res = await request(server)
                .post(url)
                .set(authHeader(testAdmin))
                .expect(200);

            expect(res.body).toEqual({ synced: 5 });
            expect(mockWooCommerceService.syncOrders).toHaveBeenCalledTimes(1);
        });

        it('should return 403 as staff', async () => {
            await request(server)
                .post(url)
                .set(authHeader(testStaff))
                .expect(403);

            expect(mockWooCommerceService.syncOrders).not.toHaveBeenCalled();
        });

        it('should return 401 without auth token', async () => {
            await request(server).post(url).expect(401);

            expect(mockWooCommerceService.syncOrders).not.toHaveBeenCalled();
        });
    });

    // ---------------------------------------------------------------
    // GET /api/woocommerce/sync-logs (admin only)
    // ---------------------------------------------------------------
    describe('GET /api/woocommerce/sync-logs', () => {
        const url = '/api/woocommerce/sync-logs';

        it('should return sync logs as admin', async () => {
            const res = await request(server)
                .get(url)
                .set(authHeader(testAdmin))
                .expect(200);

            expect(res.body).toEqual({
                data: [],
                meta: { total: 0, page: 1, limit: 25, totalPages: 0 },
            });
            expect(mockWooCommerceService.getSyncLogs).toHaveBeenCalledTimes(1);
        });

        it('should return sync logs with query parameters', async () => {
            const mockResponse = {
                data: [
                    {
                        id: '00000000-0000-4000-e000-000000000001',
                        entityType: 'product',
                        direction: 'inbound',
                        status: 'success',
                        createdAt: '2026-03-15T00:00:00.000Z',
                    },
                ],
                meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
            };
            mockWooCommerceService.getSyncLogs.mockResolvedValue(mockResponse);

            const res = await request(server)
                .get(url)
                .query({ page: 1, limit: 10 })
                .set(authHeader(testAdmin))
                .expect(200);

            expect(res.body).toEqual(mockResponse);
            expect(mockWooCommerceService.getSyncLogs).toHaveBeenCalledTimes(1);
        });

        it('should return 403 as staff', async () => {
            await request(server)
                .get(url)
                .set(authHeader(testStaff))
                .expect(403);

            expect(mockWooCommerceService.getSyncLogs).not.toHaveBeenCalled();
        });

        it('should return 401 without auth token', async () => {
            await request(server).get(url).expect(401);

            expect(mockWooCommerceService.getSyncLogs).not.toHaveBeenCalled();
        });
    });
});
