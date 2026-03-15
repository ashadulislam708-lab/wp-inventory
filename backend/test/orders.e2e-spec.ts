import request from 'supertest';
import { OrderController } from '../src/modules/orders/controllers/order.controller';
import { OrderService } from '../src/modules/orders/services/order.service';
import { OrderNoteService } from '../src/modules/orders/services/order-note.service';
import {
    createTestApp,
    closeTestApp,
    TestAppContext,
} from './helpers/test-app.factory';
import { testAdmin, testStaff, authHeader } from './helpers/auth.helper';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockOrderService = {
    listOrders: jest.fn(),
    exportOrders: jest.fn(),
    createOrder: jest.fn(),
    getOrderById: jest.fn(),
    updateOrderDetails: jest.fn(),
    updateOrderStatus: jest.fn(),
    getInvoiceData: jest.fn(),
    getQrCode: jest.fn(),
    retryCourier: jest.fn(),
    importOrdersFromCsv: jest.fn(),
};

const mockOrderNoteService = {
    addNote: jest.fn(),
    listNotes: jest.fn(),
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const testUuid = '00000000-0000-4000-a000-000000000010';
const testProductId = '00000000-0000-4000-a000-000000000020';

const validCreateOrderBody = {
    customerName: 'John Doe',
    customerPhone: '01712345678',
    customerAddress: '123 Dhanmondi, Dhaka',
    shippingZone: 'INSIDE_DHAKA',
    shippingPartner: 'STEADFAST',
    items: [{ productId: testProductId, quantity: 2 }],
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
describe('OrderController (e2e)', () => {
    let ctx: TestAppContext;
    let server: any;

    beforeAll(async () => {
        ctx = await createTestApp({
            controllers: [OrderController],
            providers: [
                { provide: OrderService, useValue: mockOrderService },
                { provide: OrderNoteService, useValue: mockOrderNoteService },
            ],
        });
        server = ctx.app.getHttpServer();
    });

    afterAll(async () => {
        await closeTestApp(ctx);
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    // =======================================================================
    // GET /api/orders
    // =======================================================================
    describe('GET /api/orders', () => {
        const url = '/api/orders';

        it('should return paginated orders for authenticated user', async () => {
            const mockResponse = {
                data: [
                    {
                        id: testUuid,
                        invoiceId: 'GL-0001',
                        customerName: 'John Doe',
                    },
                ],
                meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
            };
            mockOrderService.listOrders.mockResolvedValue(mockResponse);

            const res = await request(server)
                .get(url)
                .set(authHeader(testAdmin))
                .expect(200);

            expect(res.body).toEqual(mockResponse);
            expect(mockOrderService.listOrders).toHaveBeenCalledTimes(1);
        });

        it('should return 401 without auth token', async () => {
            await request(server).get(url).expect(401);
        });

        it('should pass filter query params to the service', async () => {
            mockOrderService.listOrders.mockResolvedValue({
                data: [],
                meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
            });

            await request(server)
                .get(url)
                .set(authHeader(testAdmin))
                .query({
                    page: 2,
                    limit: 10,
                    status: 'PENDING',
                    search: 'GL-0001',
                })
                .expect(200);

            const calledDto = mockOrderService.listOrders.mock.calls[0][0];
            expect(calledDto).toMatchObject({
                page: 2,
                limit: 10,
                status: 'PENDING',
                search: 'GL-0001',
            });
        });

        it('should work with staff auth token', async () => {
            mockOrderService.listOrders.mockResolvedValue({
                data: [],
                meta: { page: 1, limit: 25, total: 0, totalPages: 0 },
            });

            await request(server)
                .get(url)
                .set(authHeader(testStaff))
                .expect(200);
        });
    });

    // =======================================================================
    // GET /api/orders/export
    // =======================================================================
    describe('GET /api/orders/export', () => {
        const url = '/api/orders/export';

        it('should export orders as CSV with correct content type', async () => {
            const csvContent =
                'InvoiceID,Customer,Phone,Status\nGL-0001,John Doe,01712345678,PENDING\n';
            mockOrderService.exportOrders.mockResolvedValue(csvContent);

            const res = await request(server)
                .get(url)
                .set(authHeader(testAdmin))
                .expect(200);

            expect(res.headers['content-type']).toContain('text/csv');
            expect(res.text).toBe(csvContent);
        });

        it('should return 401 without auth token', async () => {
            await request(server).get(url).expect(401);
        });

        it('should pass filter query params for filtered export', async () => {
            mockOrderService.exportOrders.mockResolvedValue('InvoiceID\n');

            await request(server)
                .get(url)
                .set(authHeader(testAdmin))
                .query({ status: 'DELIVERED' })
                .expect(200);

            const calledDto = mockOrderService.exportOrders.mock.calls[0][0];
            expect(calledDto).toMatchObject({ status: 'DELIVERED' });
        });
    });

    // =======================================================================
    // POST /api/orders
    // =======================================================================
    describe('POST /api/orders', () => {
        const url = '/api/orders';

        it('should create order with valid data', async () => {
            const mockCreated = {
                id: testUuid,
                invoiceId: 'GL-0001',
                customerName: 'John Doe',
                status: 'PENDING',
            };
            mockOrderService.createOrder.mockResolvedValue(mockCreated);

            const res = await request(server)
                .post(url)
                .set(authHeader(testAdmin))
                .send(validCreateOrderBody)
                .expect(201);

            expect(res.body).toEqual(mockCreated);
            expect(mockOrderService.createOrder).toHaveBeenCalledTimes(1);

            // Verify the DTO and user payload are passed
            const [dto, user] = mockOrderService.createOrder.mock.calls[0];
            expect(dto).toMatchObject({
                customerName: 'John Doe',
                customerPhone: '01712345678',
                shippingZone: 'INSIDE_DHAKA',
            });
            expect(user).toMatchObject({ id: testAdmin.id, role: 'ADMIN' });
        });

        it('should return 401 without auth token', async () => {
            await request(server)
                .post(url)
                .send(validCreateOrderBody)
                .expect(401);
        });

        it('should return 400 when customerName is missing', async () => {
            const { customerName, ...bodyWithoutName } = validCreateOrderBody;

            await request(server)
                .post(url)
                .set(authHeader(testAdmin))
                .send(bodyWithoutName)
                .expect(400);
        });

        it('should return 400 when customerPhone is missing', async () => {
            const { customerPhone, ...bodyWithoutPhone } = validCreateOrderBody;

            await request(server)
                .post(url)
                .set(authHeader(testAdmin))
                .send(bodyWithoutPhone)
                .expect(400);
        });

        it('should return 400 when customerAddress is missing', async () => {
            const { customerAddress, ...bodyWithoutAddress } =
                validCreateOrderBody;

            await request(server)
                .post(url)
                .set(authHeader(testAdmin))
                .send(bodyWithoutAddress)
                .expect(400);
        });

        it('should return 400 when items is missing', async () => {
            const { items, ...bodyWithoutItems } = validCreateOrderBody;

            await request(server)
                .post(url)
                .set(authHeader(testAdmin))
                .send(bodyWithoutItems)
                .expect(400);
        });

        it('should accept an empty items array (no @ArrayMinSize on DTO)', async () => {
            mockOrderService.createOrder.mockResolvedValue({ id: testUuid });

            await request(server)
                .post(url)
                .set(authHeader(testAdmin))
                .send({ ...validCreateOrderBody, items: [] })
                .expect(201);
        });

        it('should return 400 when shippingZone is invalid', async () => {
            await request(server)
                .post(url)
                .set(authHeader(testAdmin))
                .send({ ...validCreateOrderBody, shippingZone: 'MARS' })
                .expect(400);
        });

        it('should return 400 when shippingPartner is invalid', async () => {
            await request(server)
                .post(url)
                .set(authHeader(testAdmin))
                .send({ ...validCreateOrderBody, shippingPartner: 'UPS' })
                .expect(400);
        });

        it('should return 400 when item has invalid productId', async () => {
            await request(server)
                .post(url)
                .set(authHeader(testAdmin))
                .send({
                    ...validCreateOrderBody,
                    items: [{ productId: 'not-a-uuid', quantity: 1 }],
                })
                .expect(400);
        });

        it('should return 400 when item quantity is 0', async () => {
            await request(server)
                .post(url)
                .set(authHeader(testAdmin))
                .send({
                    ...validCreateOrderBody,
                    items: [{ productId: testProductId, quantity: 0 }],
                })
                .expect(400);
        });

        it('should return 400 when item quantity is negative', async () => {
            await request(server)
                .post(url)
                .set(authHeader(testAdmin))
                .send({
                    ...validCreateOrderBody,
                    items: [{ productId: testProductId, quantity: -1 }],
                })
                .expect(400);
        });

        it('should reject unknown properties in body', async () => {
            await request(server)
                .post(url)
                .set(authHeader(testAdmin))
                .send({ ...validCreateOrderBody, unknownField: 'value' })
                .expect(400);
        });

        it('should allow staff to create orders', async () => {
            mockOrderService.createOrder.mockResolvedValue({ id: testUuid });

            await request(server)
                .post(url)
                .set(authHeader(testStaff))
                .send(validCreateOrderBody)
                .expect(201);

            const [, user] = mockOrderService.createOrder.mock.calls[0];
            expect(user).toMatchObject({ id: testStaff.id, role: 'STAFF' });
        });
    });

    // =======================================================================
    // GET /api/orders/:id
    // =======================================================================
    describe('GET /api/orders/:id', () => {
        it('should return order by ID', async () => {
            const mockOrder = {
                id: testUuid,
                invoiceId: 'GL-0001',
                customerName: 'John Doe',
                status: 'PENDING',
                items: [{ id: 'item-1', productName: 'Lipstick', quantity: 2 }],
            };
            mockOrderService.getOrderById.mockResolvedValue(mockOrder);

            const res = await request(server)
                .get(`/api/orders/${testUuid}`)
                .set(authHeader(testAdmin))
                .expect(200);

            expect(res.body).toEqual(mockOrder);
            expect(mockOrderService.getOrderById).toHaveBeenCalledWith(
                testUuid,
            );
        });

        it('should return 401 without auth token', async () => {
            await request(server).get(`/api/orders/${testUuid}`).expect(401);
        });

        it('should return 400 for invalid UUID', async () => {
            await request(server)
                .get('/api/orders/not-a-uuid')
                .set(authHeader(testAdmin))
                .expect(400);
        });
    });

    // =======================================================================
    // PATCH /api/orders/:id
    // =======================================================================
    describe('PATCH /api/orders/:id', () => {
        it('should update order details with valid partial data', async () => {
            const updatedOrder = {
                id: testUuid,
                customerName: 'Jane Doe Updated',
                shippingZone: 'OUTSIDE_DHAKA',
            };
            mockOrderService.updateOrderDetails.mockResolvedValue(updatedOrder);

            const res = await request(server)
                .patch(`/api/orders/${testUuid}`)
                .set(authHeader(testAdmin))
                .send({
                    customerName: 'Jane Doe Updated',
                    shippingZone: 'OUTSIDE_DHAKA',
                })
                .expect(200);

            expect(res.body).toEqual(updatedOrder);
            expect(mockOrderService.updateOrderDetails).toHaveBeenCalledWith(
                testUuid,
                expect.objectContaining({
                    customerName: 'Jane Doe Updated',
                    shippingZone: 'OUTSIDE_DHAKA',
                }),
            );
        });

        it('should return 401 without auth token', async () => {
            await request(server)
                .patch(`/api/orders/${testUuid}`)
                .send({ customerName: 'New Name' })
                .expect(401);
        });

        it('should return 400 for invalid UUID', async () => {
            await request(server)
                .patch('/api/orders/bad-id')
                .set(authHeader(testAdmin))
                .send({ customerName: 'New Name' })
                .expect(400);
        });

        it('should return 400 for invalid shippingZone value', async () => {
            await request(server)
                .patch(`/api/orders/${testUuid}`)
                .set(authHeader(testAdmin))
                .send({ shippingZone: 'JUPITER' })
                .expect(400);
        });

        it('should allow updating only customerPhone', async () => {
            mockOrderService.updateOrderDetails.mockResolvedValue({
                id: testUuid,
                customerPhone: '01899999999',
            });

            await request(server)
                .patch(`/api/orders/${testUuid}`)
                .set(authHeader(testAdmin))
                .send({ customerPhone: '01899999999' })
                .expect(200);

            expect(mockOrderService.updateOrderDetails).toHaveBeenCalledWith(
                testUuid,
                expect.objectContaining({ customerPhone: '01899999999' }),
            );
        });
    });

    // =======================================================================
    // PATCH /api/orders/:id/status
    // =======================================================================
    describe('PATCH /api/orders/:id/status', () => {
        it('should update order status with valid enum', async () => {
            const updatedOrder = { id: testUuid, status: 'CONFIRMED' };
            mockOrderService.updateOrderStatus.mockResolvedValue(updatedOrder);

            const res = await request(server)
                .patch(`/api/orders/${testUuid}/status`)
                .set(authHeader(testAdmin))
                .send({ status: 'CONFIRMED' })
                .expect(200);

            expect(res.body).toEqual(updatedOrder);
            expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith(
                testUuid,
                expect.objectContaining({ status: 'CONFIRMED' }),
                expect.objectContaining({ id: testAdmin.id }),
            );
        });

        it('should return 401 without auth token', async () => {
            await request(server)
                .patch(`/api/orders/${testUuid}/status`)
                .send({ status: 'CONFIRMED' })
                .expect(401);
        });

        it('should return 400 for invalid status enum value', async () => {
            await request(server)
                .patch(`/api/orders/${testUuid}/status`)
                .set(authHeader(testAdmin))
                .send({ status: 'EXPLODED' })
                .expect(400);
        });

        it('should return 400 when status is missing', async () => {
            await request(server)
                .patch(`/api/orders/${testUuid}/status`)
                .set(authHeader(testAdmin))
                .send({})
                .expect(400);
        });

        it('should return 400 for invalid UUID', async () => {
            await request(server)
                .patch('/api/orders/bad-id/status')
                .set(authHeader(testAdmin))
                .send({ status: 'CONFIRMED' })
                .expect(400);
        });

        it('should accept all valid status enum values', async () => {
            const validStatuses = [
                'PENDING',
                'CONFIRMED',
                'PROCESSING',
                'SHIPPED',
                'DELIVERED',
                'CANCELLED',
                'RETURNED',
            ];

            for (const status of validStatuses) {
                mockOrderService.updateOrderStatus.mockResolvedValue({
                    id: testUuid,
                    status,
                });

                await request(server)
                    .patch(`/api/orders/${testUuid}/status`)
                    .set(authHeader(testAdmin))
                    .send({ status })
                    .expect(200);
            }

            expect(mockOrderService.updateOrderStatus).toHaveBeenCalledTimes(
                validStatuses.length,
            );
        });
    });

    // =======================================================================
    // GET /api/orders/:id/invoice
    // =======================================================================
    describe('GET /api/orders/:id/invoice', () => {
        it('should return invoice data for an order', async () => {
            const invoiceData = {
                invoiceId: 'GL-0001',
                customerName: 'John Doe',
                customerPhone: '01712345678',
                customerAddress: '123 Dhanmondi, Dhaka',
                items: [
                    {
                        name: 'Lipstick',
                        quantity: 2,
                        unitPrice: 500,
                        total: 1000,
                    },
                ],
                subtotal: 1000,
                shippingFee: 80,
                grandTotal: 1080,
            };
            mockOrderService.getInvoiceData.mockResolvedValue(invoiceData);

            const res = await request(server)
                .get(`/api/orders/${testUuid}/invoice`)
                .set(authHeader(testAdmin))
                .expect(200);

            expect(res.body).toEqual(invoiceData);
            expect(mockOrderService.getInvoiceData).toHaveBeenCalledWith(
                testUuid,
            );
        });

        it('should return 401 without auth token', async () => {
            await request(server)
                .get(`/api/orders/${testUuid}/invoice`)
                .expect(401);
        });

        it('should return 400 for invalid UUID', async () => {
            await request(server)
                .get('/api/orders/not-uuid/invoice')
                .set(authHeader(testAdmin))
                .expect(400);
        });
    });

    // =======================================================================
    // GET /api/orders/:id/qr
    // =======================================================================
    describe('GET /api/orders/:id/qr', () => {
        it('should return QR code data for an order', async () => {
            const qrData = {
                qrCodeUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...',
                trackingUrl: 'https://glamlavish.com/tracking/GL-0001',
            };
            mockOrderService.getQrCode.mockResolvedValue(qrData);

            const res = await request(server)
                .get(`/api/orders/${testUuid}/qr`)
                .set(authHeader(testAdmin))
                .expect(200);

            expect(res.body).toEqual(qrData);
            expect(mockOrderService.getQrCode).toHaveBeenCalledWith(testUuid);
        });

        it('should return 401 without auth token', async () => {
            await request(server).get(`/api/orders/${testUuid}/qr`).expect(401);
        });

        it('should return 400 for invalid UUID', async () => {
            await request(server)
                .get('/api/orders/bad-uuid/qr')
                .set(authHeader(testAdmin))
                .expect(400);
        });
    });

    // =======================================================================
    // POST /api/orders/:id/retry-courier
    // =======================================================================
    describe('POST /api/orders/:id/retry-courier', () => {
        it('should retry courier push for an order', async () => {
            const retryResult = {
                id: testUuid,
                courierConsignmentId: 'SF-12345',
                courierTrackingCode: 'TRACK-001',
            };
            mockOrderService.retryCourier.mockResolvedValue(retryResult);

            const res = await request(server)
                .post(`/api/orders/${testUuid}/retry-courier`)
                .set(authHeader(testAdmin))
                .expect(200);

            expect(res.body).toEqual(retryResult);
            expect(mockOrderService.retryCourier).toHaveBeenCalledWith(
                testUuid,
            );
        });

        it('should return 401 without auth token', async () => {
            await request(server)
                .post(`/api/orders/${testUuid}/retry-courier`)
                .expect(401);
        });

        it('should return 400 for invalid UUID', async () => {
            await request(server)
                .post('/api/orders/bad-id/retry-courier')
                .set(authHeader(testAdmin))
                .expect(400);
        });

        it('should allow staff to retry courier', async () => {
            mockOrderService.retryCourier.mockResolvedValue({ id: testUuid });

            await request(server)
                .post(`/api/orders/${testUuid}/retry-courier`)
                .set(authHeader(testStaff))
                .expect(200);
        });
    });

    // =======================================================================
    // POST /api/orders/:id/notes
    // =======================================================================
    describe('POST /api/orders/:id/notes', () => {
        it('should add a note to an order', async () => {
            const noteResult = {
                id: '00000000-0000-4000-a000-000000000030',
                content: 'Customer requested gift wrapping',
                createdAt: '2026-03-15T12:00:00.000Z',
            };
            mockOrderNoteService.addNote.mockResolvedValue(noteResult);

            const res = await request(server)
                .post(`/api/orders/${testUuid}/notes`)
                .set(authHeader(testAdmin))
                .send({ content: 'Customer requested gift wrapping' })
                .expect(201);

            expect(res.body).toEqual(noteResult);
            expect(mockOrderNoteService.addNote).toHaveBeenCalledWith(
                testUuid,
                expect.objectContaining({
                    content: 'Customer requested gift wrapping',
                }),
                expect.objectContaining({ id: testAdmin.id }),
            );
        });

        it('should return 401 without auth token', async () => {
            await request(server)
                .post(`/api/orders/${testUuid}/notes`)
                .send({ content: 'A note' })
                .expect(401);
        });

        it('should return 400 when content is missing', async () => {
            await request(server)
                .post(`/api/orders/${testUuid}/notes`)
                .set(authHeader(testAdmin))
                .send({})
                .expect(400);
        });

        it('should return 400 when content is empty string', async () => {
            await request(server)
                .post(`/api/orders/${testUuid}/notes`)
                .set(authHeader(testAdmin))
                .send({ content: '' })
                .expect(400);
        });

        it('should return 400 for invalid UUID', async () => {
            await request(server)
                .post('/api/orders/bad-id/notes')
                .set(authHeader(testAdmin))
                .send({ content: 'A note' })
                .expect(400);
        });
    });

    // =======================================================================
    // GET /api/orders/:id/notes
    // =======================================================================
    describe('GET /api/orders/:id/notes', () => {
        it('should list notes for an order', async () => {
            const notes = [
                {
                    id: 'note-1',
                    content: 'First note',
                    createdAt: '2026-03-15T10:00:00.000Z',
                },
                {
                    id: 'note-2',
                    content: 'Second note',
                    createdAt: '2026-03-15T11:00:00.000Z',
                },
            ];
            mockOrderNoteService.listNotes.mockResolvedValue(notes);

            const res = await request(server)
                .get(`/api/orders/${testUuid}/notes`)
                .set(authHeader(testAdmin))
                .expect(200);

            expect(res.body).toEqual(notes);
            expect(mockOrderNoteService.listNotes).toHaveBeenCalledWith(
                testUuid,
            );
        });

        it('should return 401 without auth token', async () => {
            await request(server)
                .get(`/api/orders/${testUuid}/notes`)
                .expect(401);
        });

        it('should return 400 for invalid UUID', async () => {
            await request(server)
                .get('/api/orders/bad-id/notes')
                .set(authHeader(testAdmin))
                .expect(400);
        });
    });
});
