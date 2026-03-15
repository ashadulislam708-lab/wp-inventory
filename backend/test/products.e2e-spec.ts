import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
    createTestApp,
    closeTestApp,
    TestAppContext,
} from './helpers/test-app.factory';
import { authHeader, testAdmin, testStaff } from './helpers/auth.helper';
import { ProductController } from '../src/modules/products/controllers/product.controller';
import { ProductService } from '../src/modules/products/services/product.service';

const VALID_UUID = '00000000-0000-4000-b000-000000000001';
const INVALID_UUID = 'not-a-uuid';
const CATEGORY_UUID = '00000000-0000-4000-c000-000000000001';

const mockProductService = {
    listProducts: jest.fn(),
    getProductById: jest.fn(),
    adjustProductStock: jest.fn(),
    adjustVariationStock: jest.fn(),
    getStockHistory: jest.fn(),
    getRepository: jest.fn(),
    getVariationRepository: jest.fn(),
};

describe('Products (e2e)', () => {
    let app: INestApplication;
    let context: TestAppContext;

    beforeAll(async () => {
        context = await createTestApp({
            controllers: [ProductController],
            providers: [
                {
                    provide: ProductService,
                    useValue: mockProductService,
                },
            ],
        });
        app = context.app;
    });

    afterAll(async () => {
        await closeTestApp(context);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ─── GET /api/products ─────────────────────────────────────────────

    describe('GET /api/products', () => {
        const mockPaginatedResponse = {
            data: [
                {
                    id: VALID_UUID,
                    name: 'Glow Serum',
                    sku: 'GL-001',
                    stockQuantity: 50,
                    price: '1200.00',
                },
            ],
            meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
        };

        it('should list products with auth (admin)', async () => {
            mockProductService.listProducts.mockResolvedValue(
                mockPaginatedResponse,
            );

            const response = await request(app.getHttpServer())
                .get('/api/products')
                .set(authHeader(testAdmin))
                .expect(200);

            expect(response.body).toEqual(mockPaginatedResponse);
            expect(mockProductService.listProducts).toHaveBeenCalledTimes(1);
        });

        it('should list products with auth (staff)', async () => {
            mockProductService.listProducts.mockResolvedValue(
                mockPaginatedResponse,
            );

            const response = await request(app.getHttpServer())
                .get('/api/products')
                .set(authHeader(testStaff))
                .expect(200);

            expect(response.body).toEqual(mockPaginatedResponse);
            expect(mockProductService.listProducts).toHaveBeenCalledTimes(1);
        });

        it('should return 401 without auth token', async () => {
            await request(app.getHttpServer()).get('/api/products').expect(401);

            expect(mockProductService.listProducts).not.toHaveBeenCalled();
        });

        it('should accept pagination params (page and limit)', async () => {
            mockProductService.listProducts.mockResolvedValue({
                data: [],
                meta: { page: 2, limit: 10, total: 0, totalPages: 0 },
            });

            await request(app.getHttpServer())
                .get('/api/products')
                .query({ page: 2, limit: 10 })
                .set(authHeader(testAdmin))
                .expect(200);

            expect(mockProductService.listProducts).toHaveBeenCalledWith(
                expect.objectContaining({ page: 2, limit: 10 }),
            );
        });

        it('should accept search filter', async () => {
            mockProductService.listProducts.mockResolvedValue({
                data: [],
                meta: { page: 1, limit: 25, total: 0, totalPages: 0 },
            });

            await request(app.getHttpServer())
                .get('/api/products')
                .query({ search: 'serum' })
                .set(authHeader(testAdmin))
                .expect(200);

            expect(mockProductService.listProducts).toHaveBeenCalledWith(
                expect.objectContaining({ search: 'serum' }),
            );
        });

        it('should accept category filter (UUID)', async () => {
            mockProductService.listProducts.mockResolvedValue({
                data: [],
                meta: { page: 1, limit: 25, total: 0, totalPages: 0 },
            });

            await request(app.getHttpServer())
                .get('/api/products')
                .query({ category: CATEGORY_UUID })
                .set(authHeader(testAdmin))
                .expect(200);

            expect(mockProductService.listProducts).toHaveBeenCalledWith(
                expect.objectContaining({ category: CATEGORY_UUID }),
            );
        });

        it('should accept stockStatus filter', async () => {
            mockProductService.listProducts.mockResolvedValue({
                data: [],
                meta: { page: 1, limit: 25, total: 0, totalPages: 0 },
            });

            await request(app.getHttpServer())
                .get('/api/products')
                .query({ stockStatus: 'LOW' })
                .set(authHeader(testAdmin))
                .expect(200);

            expect(mockProductService.listProducts).toHaveBeenCalledWith(
                expect.objectContaining({ stockStatus: 'LOW' }),
            );
        });

        it('should reject invalid stockStatus enum value', async () => {
            await request(app.getHttpServer())
                .get('/api/products')
                .query({ stockStatus: 'INVALID_STATUS' })
                .set(authHeader(testAdmin))
                .expect(400);

            expect(mockProductService.listProducts).not.toHaveBeenCalled();
        });

        it('should reject page less than 1', async () => {
            await request(app.getHttpServer())
                .get('/api/products')
                .query({ page: 0 })
                .set(authHeader(testAdmin))
                .expect(400);

            expect(mockProductService.listProducts).not.toHaveBeenCalled();
        });

        it('should reject limit greater than 100', async () => {
            await request(app.getHttpServer())
                .get('/api/products')
                .query({ limit: 101 })
                .set(authHeader(testAdmin))
                .expect(400);

            expect(mockProductService.listProducts).not.toHaveBeenCalled();
        });
    });

    // ─── GET /api/products/:id ─────────────────────────────────────────

    describe('GET /api/products/:id', () => {
        const mockProduct = {
            id: VALID_UUID,
            name: 'Glow Serum',
            sku: 'GL-001',
            stockQuantity: 50,
            price: '1200.00',
            description: 'A hydrating face serum',
            variations: [],
        };

        it('should get product by ID with auth', async () => {
            mockProductService.getProductById.mockResolvedValue(mockProduct);

            const response = await request(app.getHttpServer())
                .get(`/api/products/${VALID_UUID}`)
                .set(authHeader(testAdmin))
                .expect(200);

            expect(response.body).toEqual(mockProduct);
            expect(mockProductService.getProductById).toHaveBeenCalledWith(
                VALID_UUID,
            );
        });

        it('should return 400 for invalid UUID', async () => {
            await request(app.getHttpServer())
                .get(`/api/products/${INVALID_UUID}`)
                .set(authHeader(testAdmin))
                .expect(400);

            expect(mockProductService.getProductById).not.toHaveBeenCalled();
        });

        it('should return 401 without auth token', async () => {
            await request(app.getHttpServer())
                .get(`/api/products/${VALID_UUID}`)
                .expect(401);

            expect(mockProductService.getProductById).not.toHaveBeenCalled();
        });
    });

    // ─── PATCH /api/products/:id/stock ─────────────────────────────────

    describe('PATCH /api/products/:id/stock', () => {
        const validStockAdjustment = {
            quantity: 10,
            reason: 'Restocked from supplier',
        };

        const mockAdjustmentResult = {
            id: VALID_UUID,
            name: 'Glow Serum',
            stockQuantity: 60,
        };

        it('should adjust stock with valid data (admin)', async () => {
            mockProductService.adjustProductStock.mockResolvedValue(
                mockAdjustmentResult,
            );

            const response = await request(app.getHttpServer())
                .patch(`/api/products/${VALID_UUID}/stock`)
                .set(authHeader(testAdmin))
                .send(validStockAdjustment)
                .expect(200);

            expect(response.body).toEqual(mockAdjustmentResult);
            expect(mockProductService.adjustProductStock).toHaveBeenCalledWith(
                VALID_UUID,
                validStockAdjustment,
                expect.objectContaining({
                    id: testAdmin.id,
                    role: testAdmin.role,
                }),
            );
        });

        it('should adjust stock with valid data (staff)', async () => {
            mockProductService.adjustProductStock.mockResolvedValue(
                mockAdjustmentResult,
            );

            const response = await request(app.getHttpServer())
                .patch(`/api/products/${VALID_UUID}/stock`)
                .set(authHeader(testStaff))
                .send(validStockAdjustment)
                .expect(200);

            expect(response.body).toEqual(mockAdjustmentResult);
            expect(mockProductService.adjustProductStock).toHaveBeenCalledWith(
                VALID_UUID,
                validStockAdjustment,
                expect.objectContaining({
                    id: testStaff.id,
                    role: testStaff.role,
                }),
            );
        });

        it('should return 400 when quantity is missing', async () => {
            await request(app.getHttpServer())
                .patch(`/api/products/${VALID_UUID}/stock`)
                .set(authHeader(testAdmin))
                .send({ reason: 'Restocked' })
                .expect(400);

            expect(
                mockProductService.adjustProductStock,
            ).not.toHaveBeenCalled();
        });

        it('should return 400 when reason is missing', async () => {
            await request(app.getHttpServer())
                .patch(`/api/products/${VALID_UUID}/stock`)
                .set(authHeader(testAdmin))
                .send({ quantity: 10 })
                .expect(400);

            expect(
                mockProductService.adjustProductStock,
            ).not.toHaveBeenCalled();
        });

        it('should return 400 when quantity is not an integer', async () => {
            await request(app.getHttpServer())
                .patch(`/api/products/${VALID_UUID}/stock`)
                .set(authHeader(testAdmin))
                .send({ quantity: 10.5, reason: 'Restocked' })
                .expect(400);

            expect(
                mockProductService.adjustProductStock,
            ).not.toHaveBeenCalled();
        });

        it('should return 400 when reason is empty string', async () => {
            await request(app.getHttpServer())
                .patch(`/api/products/${VALID_UUID}/stock`)
                .set(authHeader(testAdmin))
                .send({ quantity: 10, reason: '' })
                .expect(400);

            expect(
                mockProductService.adjustProductStock,
            ).not.toHaveBeenCalled();
        });

        it('should return 400 for invalid UUID in path', async () => {
            await request(app.getHttpServer())
                .patch(`/api/products/${INVALID_UUID}/stock`)
                .set(authHeader(testAdmin))
                .send(validStockAdjustment)
                .expect(400);

            expect(
                mockProductService.adjustProductStock,
            ).not.toHaveBeenCalled();
        });

        it('should return 400 when body contains unknown properties', async () => {
            await request(app.getHttpServer())
                .patch(`/api/products/${VALID_UUID}/stock`)
                .set(authHeader(testAdmin))
                .send({ quantity: 10, reason: 'Restocked', unknownField: true })
                .expect(400);

            expect(
                mockProductService.adjustProductStock,
            ).not.toHaveBeenCalled();
        });

        it('should return 401 without auth token', async () => {
            await request(app.getHttpServer())
                .patch(`/api/products/${VALID_UUID}/stock`)
                .send(validStockAdjustment)
                .expect(401);

            expect(
                mockProductService.adjustProductStock,
            ).not.toHaveBeenCalled();
        });

        it('should allow negative quantity for stock decrement', async () => {
            const decrementPayload = {
                quantity: -5,
                reason: 'Damaged items removed',
            };
            mockProductService.adjustProductStock.mockResolvedValue({
                ...mockAdjustmentResult,
                stockQuantity: 45,
            });

            await request(app.getHttpServer())
                .patch(`/api/products/${VALID_UUID}/stock`)
                .set(authHeader(testAdmin))
                .send(decrementPayload)
                .expect(200);

            expect(mockProductService.adjustProductStock).toHaveBeenCalledWith(
                VALID_UUID,
                decrementPayload,
                expect.objectContaining({ id: testAdmin.id }),
            );
        });
    });

    // ─── PATCH /api/products/variations/:id/stock ──────────────────────

    describe('PATCH /api/products/variations/:id/stock', () => {
        const validStockAdjustment = {
            quantity: 5,
            reason: 'Variation restock',
        };

        const mockVariationResult = {
            id: VALID_UUID,
            attributes: { Color: 'Red', Size: 'XL' },
            stockQuantity: 25,
        };

        it('should adjust variation stock with valid data', async () => {
            mockProductService.adjustVariationStock.mockResolvedValue(
                mockVariationResult,
            );

            const response = await request(app.getHttpServer())
                .patch(`/api/products/variations/${VALID_UUID}/stock`)
                .set(authHeader(testAdmin))
                .send(validStockAdjustment)
                .expect(200);

            expect(response.body).toEqual(mockVariationResult);
            expect(
                mockProductService.adjustVariationStock,
            ).toHaveBeenCalledWith(
                VALID_UUID,
                validStockAdjustment,
                expect.objectContaining({
                    id: testAdmin.id,
                    role: testAdmin.role,
                }),
            );
        });

        it('should adjust variation stock as staff', async () => {
            mockProductService.adjustVariationStock.mockResolvedValue(
                mockVariationResult,
            );

            await request(app.getHttpServer())
                .patch(`/api/products/variations/${VALID_UUID}/stock`)
                .set(authHeader(testStaff))
                .send(validStockAdjustment)
                .expect(200);

            expect(
                mockProductService.adjustVariationStock,
            ).toHaveBeenCalledWith(
                VALID_UUID,
                validStockAdjustment,
                expect.objectContaining({
                    id: testStaff.id,
                    role: testStaff.role,
                }),
            );
        });

        it('should return 400 when quantity is missing', async () => {
            await request(app.getHttpServer())
                .patch(`/api/products/variations/${VALID_UUID}/stock`)
                .set(authHeader(testAdmin))
                .send({ reason: 'Restock' })
                .expect(400);

            expect(
                mockProductService.adjustVariationStock,
            ).not.toHaveBeenCalled();
        });

        it('should return 400 when reason is missing', async () => {
            await request(app.getHttpServer())
                .patch(`/api/products/variations/${VALID_UUID}/stock`)
                .set(authHeader(testAdmin))
                .send({ quantity: 5 })
                .expect(400);

            expect(
                mockProductService.adjustVariationStock,
            ).not.toHaveBeenCalled();
        });

        it('should return 400 for invalid UUID in path', async () => {
            await request(app.getHttpServer())
                .patch(`/api/products/variations/${INVALID_UUID}/stock`)
                .set(authHeader(testAdmin))
                .send(validStockAdjustment)
                .expect(400);

            expect(
                mockProductService.adjustVariationStock,
            ).not.toHaveBeenCalled();
        });

        it('should return 401 without auth token', async () => {
            await request(app.getHttpServer())
                .patch(`/api/products/variations/${VALID_UUID}/stock`)
                .send(validStockAdjustment)
                .expect(401);

            expect(
                mockProductService.adjustVariationStock,
            ).not.toHaveBeenCalled();
        });
    });

    // ─── GET /api/products/:id/stock-history ───────────────────────────

    describe('GET /api/products/:id/stock-history', () => {
        const mockStockHistory = {
            data: [
                {
                    id: '00000000-0000-4000-d000-000000000001',
                    productId: VALID_UUID,
                    previousQuantity: 40,
                    newQuantity: 50,
                    quantityChange: 10,
                    reason: 'Restocked from supplier',
                    adjustedBy: testAdmin.id,
                    createdAt: '2026-03-10T12:00:00.000Z',
                },
            ],
            meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
        };

        it('should get stock history with auth', async () => {
            mockProductService.getStockHistory.mockResolvedValue(
                mockStockHistory,
            );

            const response = await request(app.getHttpServer())
                .get(`/api/products/${VALID_UUID}/stock-history`)
                .set(authHeader(testAdmin))
                .expect(200);

            expect(response.body).toEqual(mockStockHistory);
            expect(mockProductService.getStockHistory).toHaveBeenCalledWith(
                VALID_UUID,
                expect.any(Object),
            );
        });

        it('should get stock history as staff', async () => {
            mockProductService.getStockHistory.mockResolvedValue(
                mockStockHistory,
            );

            await request(app.getHttpServer())
                .get(`/api/products/${VALID_UUID}/stock-history`)
                .set(authHeader(testStaff))
                .expect(200);

            expect(mockProductService.getStockHistory).toHaveBeenCalledTimes(1);
        });

        it('should accept pagination params', async () => {
            mockProductService.getStockHistory.mockResolvedValue({
                data: [],
                meta: { page: 2, limit: 10, total: 0, totalPages: 0 },
            });

            await request(app.getHttpServer())
                .get(`/api/products/${VALID_UUID}/stock-history`)
                .query({ page: 2, limit: 10 })
                .set(authHeader(testAdmin))
                .expect(200);

            expect(mockProductService.getStockHistory).toHaveBeenCalledWith(
                VALID_UUID,
                expect.objectContaining({ page: 2, limit: 10 }),
            );
        });

        it('should reject page less than 1', async () => {
            await request(app.getHttpServer())
                .get(`/api/products/${VALID_UUID}/stock-history`)
                .query({ page: 0 })
                .set(authHeader(testAdmin))
                .expect(400);

            expect(mockProductService.getStockHistory).not.toHaveBeenCalled();
        });

        it('should reject limit greater than 100', async () => {
            await request(app.getHttpServer())
                .get(`/api/products/${VALID_UUID}/stock-history`)
                .query({ limit: 101 })
                .set(authHeader(testAdmin))
                .expect(400);

            expect(mockProductService.getStockHistory).not.toHaveBeenCalled();
        });

        it('should return 400 for invalid UUID in path', async () => {
            await request(app.getHttpServer())
                .get(`/api/products/${INVALID_UUID}/stock-history`)
                .set(authHeader(testAdmin))
                .expect(400);

            expect(mockProductService.getStockHistory).not.toHaveBeenCalled();
        });

        it('should return 401 without auth token', async () => {
            await request(app.getHttpServer())
                .get(`/api/products/${VALID_UUID}/stock-history`)
                .expect(401);

            expect(mockProductService.getStockHistory).not.toHaveBeenCalled();
        });
    });
});
