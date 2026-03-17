import request from 'supertest';
import { DashboardController } from '../src/modules/dashboard/controllers/dashboard.controller';
import { DashboardService } from '../src/modules/dashboard/services/dashboard.service';
import {
    createTestApp,
    closeTestApp,
    TestAppContext,
} from './helpers/test-app.factory';
import { testAdmin, testStaff, authHeader } from './helpers/auth.helper';

const mockDashboardService = {
    getStats: jest.fn().mockResolvedValue({
        ordersToday: 5,
        revenue: 5000,
        pendingOrders: 3,
        failedCourier: 1,
        syncErrors: 0,
    }),
    getLowStockProducts: jest.fn().mockResolvedValue([]),
    getRecentOrders: jest.fn().mockResolvedValue([]),
};

describe('DashboardController (e2e)', () => {
    let ctx: TestAppContext;
    let server: any;

    beforeAll(async () => {
        ctx = await createTestApp({
            controllers: [DashboardController],
            providers: [
                { provide: DashboardService, useValue: mockDashboardService },
            ],
        });
        server = ctx.app.getHttpServer();
    });

    afterAll(async () => {
        await closeTestApp(ctx);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ---------------------------------------------------------------
    // GET /api/dashboard/stats
    // ---------------------------------------------------------------
    describe('GET /api/dashboard/stats', () => {
        const url = '/api/dashboard/stats';

        it('should return dashboard stats as admin', async () => {
            const res = await request(server)
                .get(url)
                .set(authHeader(testAdmin))
                .expect(200);

            expect(res.body).toEqual({
                ordersToday: 5,
                revenue: 5000,
                pendingOrders: 3,
                failedCourier: 1,
                syncErrors: 0,
            });
            expect(mockDashboardService.getStats).toHaveBeenCalledTimes(1);
        });

        it('should return dashboard stats as staff', async () => {
            const res = await request(server)
                .get(url)
                .set(authHeader(testStaff))
                .expect(200);

            expect(res.body).toEqual({
                ordersToday: 5,
                revenue: 5000,
                pendingOrders: 3,
                failedCourier: 1,
                syncErrors: 0,
            });
            expect(mockDashboardService.getStats).toHaveBeenCalledTimes(1);
        });

        it('should return 401 without auth token', async () => {
            await request(server).get(url).expect(401);

            expect(mockDashboardService.getStats).not.toHaveBeenCalled();
        });

        it('should return 401 with an invalid auth token', async () => {
            await request(server)
                .get(url)
                .set({ Authorization: 'Bearer invalid-token-string' })
                .expect(401);

            expect(mockDashboardService.getStats).not.toHaveBeenCalled();
        });
    });

    // ---------------------------------------------------------------
    // GET /api/dashboard/low-stock
    // ---------------------------------------------------------------
    describe('GET /api/dashboard/low-stock', () => {
        const url = '/api/dashboard/low-stock';

        it('should return low stock products as admin', async () => {
            const lowStockProducts = [
                {
                    id: '00000000-0000-4000-c000-000000000001',
                    name: 'Face Cream',
                    sku: 'FC-001',
                    stockQuantity: 2,
                },
            ];
            mockDashboardService.getLowStockProducts.mockResolvedValue(
                lowStockProducts,
            );

            const res = await request(server)
                .get(url)
                .set(authHeader(testAdmin))
                .expect(200);

            expect(res.body).toEqual(lowStockProducts);
            expect(
                mockDashboardService.getLowStockProducts,
            ).toHaveBeenCalledTimes(1);
        });

        it('should return low stock products as staff', async () => {
            mockDashboardService.getLowStockProducts.mockResolvedValue([]);

            const res = await request(server)
                .get(url)
                .set(authHeader(testStaff))
                .expect(200);

            expect(res.body).toEqual([]);
            expect(
                mockDashboardService.getLowStockProducts,
            ).toHaveBeenCalledTimes(1);
        });

        it('should return 401 without auth token', async () => {
            await request(server).get(url).expect(401);

            expect(
                mockDashboardService.getLowStockProducts,
            ).not.toHaveBeenCalled();
        });

        it('should return an empty array when no low stock items exist', async () => {
            mockDashboardService.getLowStockProducts.mockResolvedValue([]);

            const res = await request(server)
                .get(url)
                .set(authHeader(testAdmin))
                .expect(200);

            expect(res.body).toEqual([]);
            expect(
                mockDashboardService.getLowStockProducts,
            ).toHaveBeenCalledTimes(1);
        });
    });

    // ---------------------------------------------------------------
    // GET /api/dashboard/recent-orders
    // ---------------------------------------------------------------
    describe('GET /api/dashboard/recent-orders', () => {
        const url = '/api/dashboard/recent-orders';

        it('should return recent orders as admin', async () => {
            const recentOrders = [
                {
                    id: '00000000-0000-4000-d000-000000000001',
                    invoiceId: 'GL-0001',
                    customerName: 'John Doe',
                    grandTotal: '1500.00',
                    status: 'PENDING',
                },
            ];
            mockDashboardService.getRecentOrders.mockResolvedValue(
                recentOrders,
            );

            const res = await request(server)
                .get(url)
                .set(authHeader(testAdmin))
                .expect(200);

            expect(res.body).toEqual(recentOrders);
            expect(mockDashboardService.getRecentOrders).toHaveBeenCalledTimes(
                1,
            );
        });

        it('should return recent orders as staff', async () => {
            mockDashboardService.getRecentOrders.mockResolvedValue([]);

            const res = await request(server)
                .get(url)
                .set(authHeader(testStaff))
                .expect(200);

            expect(res.body).toEqual([]);
            expect(mockDashboardService.getRecentOrders).toHaveBeenCalledTimes(
                1,
            );
        });

        it('should return 401 without auth token', async () => {
            await request(server).get(url).expect(401);

            expect(mockDashboardService.getRecentOrders).not.toHaveBeenCalled();
        });

        it('should return an empty array when no recent orders exist', async () => {
            mockDashboardService.getRecentOrders.mockResolvedValue([]);

            const res = await request(server)
                .get(url)
                .set(authHeader(testAdmin))
                .expect(200);

            expect(res.body).toEqual([]);
            expect(mockDashboardService.getRecentOrders).toHaveBeenCalledTimes(
                1,
            );
        });
    });
});
