import { JwtService } from '@nestjs/jwt';

/**
 * Must match the fallback in envConfigService.getAuthJWTConfig().AUTH_JWT_SECRET
 */
export const TEST_JWT_SECRET = 'fallback-secret-min-32-chars-long-glam-lavish';

const jwtService = new JwtService({
    secret: TEST_JWT_SECRET,
    signOptions: { expiresIn: '1h' },
});

export interface TestUserPayload {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'STAFF';
    isActive?: boolean;
}

export const testAdmin: TestUserPayload = {
    id: '00000000-0000-4000-a000-000000000001',
    email: 'admin@glamlavish.test',
    name: 'Test Admin',
    role: 'ADMIN',
    isActive: true,
};

export const testStaff: TestUserPayload = {
    id: '00000000-0000-4000-a000-000000000002',
    email: 'staff@glamlavish.test',
    name: 'Test Staff',
    role: 'STAFF',
    isActive: true,
};

export function generateTestToken(user: TestUserPayload): string {
    return jwtService.sign({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive ?? true,
    });
}

export function authHeader(user: TestUserPayload): Record<string, string> {
    return { Authorization: `Bearer ${generateTestToken(user)}` };
}
