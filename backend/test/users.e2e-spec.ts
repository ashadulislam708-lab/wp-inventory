import request from 'supertest';
import { UserController } from '../src/modules/users/user.controller';
import { UserService } from '../src/modules/users/user.service';
import { RolesGuard } from '../src/core/guards/roles.guard';
import {
    createTestApp,
    closeTestApp,
    TestAppContext,
} from './helpers/test-app.factory';
import { testAdmin, testStaff, authHeader } from './helpers/auth.helper';

const mockUserService = {
    getAllUsers: jest.fn(),
    getUserById: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deactivateUser: jest.fn(),
};

describe('UserController (e2e)', () => {
    let ctx: TestAppContext;
    let server: any;

    beforeAll(async () => {
        ctx = await createTestApp({
            controllers: [UserController],
            providers: [
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
        jest.resetAllMocks();
    });

    // ---------------------------------------------------------------
    // GET /api/users (admin only)
    // ---------------------------------------------------------------
    describe('GET /api/users', () => {
        const url = '/api/users';

        it('should list users as admin', async () => {
            const users = [
                {
                    id: testAdmin.id,
                    email: testAdmin.email,
                    name: testAdmin.name,
                    role: 'ADMIN',
                },
                {
                    id: testStaff.id,
                    email: testStaff.email,
                    name: testStaff.name,
                    role: 'STAFF',
                },
            ];
            mockUserService.getAllUsers.mockResolvedValue(users);

            const res = await request(server)
                .get(url)
                .set(authHeader(testAdmin))
                .expect(200);

            expect(res.body).toEqual(users);
            expect(mockUserService.getAllUsers).toHaveBeenCalled();
        });

        it('should return 403 as staff', async () => {
            await request(server)
                .get(url)
                .set(authHeader(testStaff))
                .expect(403);

            expect(mockUserService.getAllUsers).not.toHaveBeenCalled();
        });

        it('should return 401 without auth', async () => {
            await request(server).get(url).expect(401);
        });
    });

    // ---------------------------------------------------------------
    // GET /api/users/:id (admin only)
    // ---------------------------------------------------------------
    describe('GET /api/users/:id', () => {
        const validId = '00000000-0000-4000-a000-000000000010';
        const url = `/api/users/${validId}`;

        it('should get user by ID as admin', async () => {
            const user = {
                id: validId,
                email: 'user@test.com',
                name: 'User',
                role: 'STAFF',
            };
            mockUserService.getUserById.mockResolvedValue(user);

            const res = await request(server)
                .get(url)
                .set(authHeader(testAdmin))
                .expect(200);

            expect(res.body).toEqual(user);
            expect(mockUserService.getUserById).toHaveBeenCalledWith(validId);
        });

        it('should return 400 for invalid UUID', async () => {
            await request(server)
                .get('/api/users/not-a-uuid')
                .set(authHeader(testAdmin))
                .expect(400);
        });

        it('should return 403 as staff', async () => {
            await request(server)
                .get(url)
                .set(authHeader(testStaff))
                .expect(403);

            expect(mockUserService.getUserById).not.toHaveBeenCalled();
        });
    });

    // ---------------------------------------------------------------
    // POST /api/users (admin only)
    // ---------------------------------------------------------------
    describe('POST /api/users', () => {
        const url = '/api/users';
        const validBody = {
            email: 'newuser@glamlavish.test',
            password: 'StrongPass1!',
            name: 'New User',
            role: 'STAFF',
        };

        it('should create user as admin', async () => {
            const created = {
                id: '00000000-0000-4000-a000-000000000020',
                email: validBody.email,
                name: validBody.name,
                role: validBody.role,
            };
            mockUserService.createUser.mockResolvedValue(created);

            const res = await request(server)
                .post(url)
                .set(authHeader(testAdmin))
                .send(validBody)
                .expect(201);

            expect(res.body).toEqual(created);
            expect(mockUserService.createUser).toHaveBeenCalledWith(validBody);
        });

        it('should return 400 for missing required fields', async () => {
            await request(server)
                .post(url)
                .set(authHeader(testAdmin))
                .send({})
                .expect(400);
        });

        it('should return 400 for invalid email format', async () => {
            await request(server)
                .post(url)
                .set(authHeader(testAdmin))
                .send({ ...validBody, email: 'not-an-email' })
                .expect(400);
        });

        it('should return 400 for short password (< 8 chars)', async () => {
            await request(server)
                .post(url)
                .set(authHeader(testAdmin))
                .send({ ...validBody, password: 'Short1' })
                .expect(400);
        });

        it('should return 403 as staff', async () => {
            await request(server)
                .post(url)
                .set(authHeader(testStaff))
                .send(validBody)
                .expect(403);

            expect(mockUserService.createUser).not.toHaveBeenCalled();
        });
    });

    // ---------------------------------------------------------------
    // PATCH /api/users/:id (admin only)
    // ---------------------------------------------------------------
    describe('PATCH /api/users/:id', () => {
        const validId = '00000000-0000-4000-a000-000000000010';
        const url = `/api/users/${validId}`;

        it('should update user as admin', async () => {
            const updateBody = { name: 'Updated Name' };
            const updated = {
                id: validId,
                email: 'user@test.com',
                name: 'Updated Name',
                role: 'STAFF',
            };
            mockUserService.updateUser.mockResolvedValue(updated);

            const res = await request(server)
                .patch(url)
                .set(authHeader(testAdmin))
                .send(updateBody)
                .expect(200);

            expect(res.body).toEqual(updated);
            expect(mockUserService.updateUser).toHaveBeenCalledWith(
                validId,
                updateBody,
            );
        });

        it('should return 403 as staff', async () => {
            await request(server)
                .patch(url)
                .set(authHeader(testStaff))
                .send({ name: 'Hacked' })
                .expect(403);

            expect(mockUserService.updateUser).not.toHaveBeenCalled();
        });
    });

    // ---------------------------------------------------------------
    // DELETE /api/users/:id (admin only)
    // ---------------------------------------------------------------
    describe('DELETE /api/users/:id', () => {
        const validId = '00000000-0000-4000-a000-000000000010';
        const url = `/api/users/${validId}`;

        it('should deactivate user as admin', async () => {
            mockUserService.deactivateUser.mockResolvedValue({
                message: 'User deactivated successfully',
            });

            const res = await request(server)
                .delete(url)
                .set(authHeader(testAdmin))
                .expect(200);

            expect(res.body).toEqual({
                message: 'User deactivated successfully',
            });
            expect(mockUserService.deactivateUser).toHaveBeenCalledWith(
                validId,
            );
        });

        it('should return 403 as staff', async () => {
            await request(server)
                .delete(url)
                .set(authHeader(testStaff))
                .expect(403);

            expect(mockUserService.deactivateUser).not.toHaveBeenCalled();
        });
    });
});
