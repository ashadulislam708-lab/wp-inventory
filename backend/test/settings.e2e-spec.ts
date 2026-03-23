import request from 'supertest';
import { SettingsController } from '../src/modules/settings/controllers/settings.controller';
import { WooCommerceService } from '../src/modules/woocommerce/services/woocommerce.service';
import { UserService } from '../src/modules/users/user.service';
import { RolesGuard } from '../src/core/guards/roles.guard';
import {
    createTestApp,
    closeTestApp,
    TestAppContext,
} from './helpers/test-app.factory';
import { testAdmin, testStaff, authHeader } from './helpers/auth.helper';

const mockWooCommerceService = {
    checkWcStatus: jest.fn().mockResolvedValue({
        connected: true,
        storeUrl: 'https://glamlavish.com',
    }),
};

const mockUserService = {
    getUserById: jest.fn(),
    updateUser: jest.fn(),
};

describe('SettingsController (e2e)', () => {
    let ctx: TestAppContext;
    let server: any;

    beforeAll(async () => {
        ctx = await createTestApp({
            controllers: [SettingsController],
            providers: [
                {
                    provide: WooCommerceService,
                    useValue: mockWooCommerceService,
                },
                { provide: UserService, useValue: mockUserService },
                RolesGuard,
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
    // GET /api/settings/wc-status (admin only)
    // ---------------------------------------------------------------
    describe('GET /api/settings/wc-status', () => {
        const url = '/api/settings/wc-status';

        it('should return WC connection status as admin', async () => {
            const res = await request(server)
                .get(url)
                .set(authHeader(testAdmin))
                .expect(200);

            expect(res.body).toEqual({
                connected: true,
                storeUrl: 'https://glamlavish.com',
            });
            expect(mockWooCommerceService.checkWcStatus).toHaveBeenCalledTimes(
                1,
            );
        });

        it('should return disconnected status when WC is not connected', async () => {
            mockWooCommerceService.checkWcStatus.mockResolvedValue({
                connected: false,
                storeUrl: null,
            });

            const res = await request(server)
                .get(url)
                .set(authHeader(testAdmin))
                .expect(200);

            expect(res.body).toEqual({
                connected: false,
                storeUrl: null,
            });
            expect(mockWooCommerceService.checkWcStatus).toHaveBeenCalledTimes(
                1,
            );
        });

        it('should return 403 as staff', async () => {
            await request(server)
                .get(url)
                .set(authHeader(testStaff))
                .expect(403);

            expect(mockWooCommerceService.checkWcStatus).not.toHaveBeenCalled();
        });

        it('should return 401 without auth token', async () => {
            await request(server).get(url).expect(401);

            expect(mockWooCommerceService.checkWcStatus).not.toHaveBeenCalled();
        });

        it('should return 401 with an invalid auth token', async () => {
            await request(server)
                .get(url)
                .set({ Authorization: 'Bearer invalid-token-string' })
                .expect(401);

            expect(mockWooCommerceService.checkWcStatus).not.toHaveBeenCalled();
        });
    });
});
