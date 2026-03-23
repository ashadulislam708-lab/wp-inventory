import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
    createTestApp,
    closeTestApp,
    TestAppContext,
} from './helpers/test-app.factory';
import { authHeader, testAdmin, testStaff } from './helpers/auth.helper';
import { CategoryController } from '../src/modules/categories/controllers/category.controller';
import { CategoryService } from '../src/modules/categories/services/category.service';

const mockCategoryService = {
    findAll: jest.fn(),
    findOrCreateByWcId: jest.fn(),
    findById: jest.fn(),
};

describe('Categories (e2e)', () => {
    let app: INestApplication;
    let context: TestAppContext;

    beforeAll(async () => {
        context = await createTestApp({
            controllers: [CategoryController],
            providers: [
                {
                    provide: CategoryService,
                    useValue: mockCategoryService,
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

    describe('GET /api/categories', () => {
        const mockCategories = [
            {
                id: '00000000-0000-4000-b000-000000000001',
                name: 'Skincare',
                wcId: 10,
                slug: 'skincare',
                parentId: null,
                createdAt: '2026-03-01T00:00:00.000Z',
                updatedAt: '2026-03-01T00:00:00.000Z',
            },
            {
                id: '00000000-0000-4000-b000-000000000002',
                name: 'Makeup',
                wcId: 20,
                slug: 'makeup',
                parentId: null,
                createdAt: '2026-03-01T00:00:00.000Z',
                updatedAt: '2026-03-01T00:00:00.000Z',
            },
        ];

        it('should list categories when authenticated as admin', async () => {
            mockCategoryService.findAll.mockResolvedValue(mockCategories);

            const response = await request(app.getHttpServer())
                .get('/api/categories')
                .set(authHeader(testAdmin))
                .expect(200);

            expect(response.body).toEqual(mockCategories);
            expect(mockCategoryService.findAll).toHaveBeenCalledTimes(1);
        });

        it('should list categories when authenticated as staff', async () => {
            mockCategoryService.findAll.mockResolvedValue(mockCategories);

            const response = await request(app.getHttpServer())
                .get('/api/categories')
                .set(authHeader(testStaff))
                .expect(200);

            expect(response.body).toEqual(mockCategories);
            expect(mockCategoryService.findAll).toHaveBeenCalledTimes(1);
        });

        it('should return 401 without auth token', async () => {
            await request(app.getHttpServer())
                .get('/api/categories')
                .expect(401);

            expect(mockCategoryService.findAll).not.toHaveBeenCalled();
        });

        it('should return 401 with an invalid auth token', async () => {
            await request(app.getHttpServer())
                .get('/api/categories')
                .set({ Authorization: 'Bearer invalid-token-string' })
                .expect(401);

            expect(mockCategoryService.findAll).not.toHaveBeenCalled();
        });

        it('should return an empty array when no categories exist', async () => {
            mockCategoryService.findAll.mockResolvedValue([]);

            const response = await request(app.getHttpServer())
                .get('/api/categories')
                .set(authHeader(testAdmin))
                .expect(200);

            expect(response.body).toEqual([]);
            expect(mockCategoryService.findAll).toHaveBeenCalledTimes(1);
        });
    });
});
