import request from 'supertest';
import { NotFoundException } from '@nestjs/common';
import { TrackingController } from '../src/modules/tracking/controllers/tracking.controller';
import { TrackingService } from '../src/modules/tracking/services/tracking.service';
import {
    createTestApp,
    closeTestApp,
    TestAppContext,
} from './helpers/test-app.factory';
import { testAdmin, authHeader } from './helpers/auth.helper';

const mockTrackingService = {
    getTrackingByInvoiceId: jest.fn(),
};

describe('TrackingController (e2e)', () => {
    let ctx: TestAppContext;
    let server: any;

    beforeAll(async () => {
        ctx = await createTestApp({
            controllers: [TrackingController],
            providers: [
                { provide: TrackingService, useValue: mockTrackingService },
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
    // GET /api/tracking/:invoiceId (public - no auth required)
    // ---------------------------------------------------------------
    describe('GET /api/tracking/:invoiceId', () => {
        const invoiceId = 'GL-0001';
        const url = `/api/tracking/${invoiceId}`;

        it('should return tracking info without auth (public endpoint)', async () => {
            const trackingData = {
                invoiceId: 'GL-0001',
                customerName: 'J*** D**',
                customerPhone: '017XXXXXXXX',
                shippingAddress: 'Dhaka, Bangladesh',
                status: 'SHIPPED',
                courierTrackingId: 'ST-12345',
                items: [
                    {
                        productName: 'Face Cream',
                        quantity: 2,
                        unitPrice: '500.00',
                    },
                ],
                grandTotal: '1080.00',
                shippingFee: '80.00',
                createdAt: '2026-03-15T10:00:00.000Z',
            };
            mockTrackingService.getTrackingByInvoiceId.mockResolvedValue(
                trackingData,
            );

            const res = await request(server).get(url).expect(200);

            expect(res.body).toEqual(trackingData);
            expect(
                mockTrackingService.getTrackingByInvoiceId,
            ).toHaveBeenCalledTimes(1);
            expect(
                mockTrackingService.getTrackingByInvoiceId,
            ).toHaveBeenCalledWith(invoiceId);
        });

        it('should return tracking data with masked customer name', async () => {
            const maskedData = {
                invoiceId: 'GL-0002',
                customerName: 'A*** I****',
                customerPhone: '018XXXXXXXX',
                shippingAddress: 'Chittagong, Bangladesh',
                status: 'PENDING',
                courierTrackingId: null,
                items: [],
                grandTotal: '2000.00',
                shippingFee: '150.00',
                createdAt: '2026-03-15T12:00:00.000Z',
            };
            mockTrackingService.getTrackingByInvoiceId.mockResolvedValue(
                maskedData,
            );

            const res = await request(server)
                .get('/api/tracking/GL-0002')
                .expect(200);

            expect(res.body.customerName).toBe('A*** I****');
            expect(
                mockTrackingService.getTrackingByInvoiceId,
            ).toHaveBeenCalledWith('GL-0002');
        });

        it('should return 404 for non-existent invoice', async () => {
            mockTrackingService.getTrackingByInvoiceId.mockRejectedValue(
                new NotFoundException('Order not found'),
            );

            await request(server).get('/api/tracking/GL-9999').expect(404);

            expect(
                mockTrackingService.getTrackingByInvoiceId,
            ).toHaveBeenCalledWith('GL-9999');
        });

        it('should also work when authenticated (public endpoint allows both)', async () => {
            const trackingData = {
                invoiceId: 'GL-0001',
                customerName: 'J*** D**',
                status: 'DELIVERED',
                grandTotal: '1080.00',
            };
            mockTrackingService.getTrackingByInvoiceId.mockResolvedValue(
                trackingData,
            );

            const res = await request(server)
                .get(url)
                .set(authHeader(testAdmin))
                .expect(200);

            expect(res.body).toEqual(trackingData);
            expect(
                mockTrackingService.getTrackingByInvoiceId,
            ).toHaveBeenCalledWith(invoiceId);
        });

        it('should handle different invoice ID formats', async () => {
            const trackingData = {
                invoiceId: 'GL-1234',
                customerName: 'T*** U***',
                status: 'CONFIRMED',
                grandTotal: '500.00',
            };
            mockTrackingService.getTrackingByInvoiceId.mockResolvedValue(
                trackingData,
            );

            const res = await request(server)
                .get('/api/tracking/GL-1234')
                .expect(200);

            expect(res.body.invoiceId).toBe('GL-1234');
            expect(
                mockTrackingService.getTrackingByInvoiceId,
            ).toHaveBeenCalledWith('GL-1234');
        });
    });
});
