# Global Authentication System

## Overview

This application uses **global JWT authentication** that protects all routes by default. You can mark specific routes as public using the `@Public()` decorator.

## How It Works

### 1. Global JWT Guard

The `JwtAuthGuard` is registered globally in `app.module.ts` using `APP_GUARD`:

```typescript
providers: [
  // Global JWT Authentication Guard
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
],
```

**This means ALL routes require authentication by default!** 🔒

### 2. Making Routes Public

To make specific routes accessible without authentication, use the `@Public()` decorator:

```typescript
import { Public } from 'src/core/decorators';

@Public()
@Get('products')
async getAllProducts() {
  return this.productService.findAll();
}
```

## Product Controller Example

The `ProductController` demonstrates both public and protected routes:

### Public Routes (No Auth Required) 🌐

```typescript
@Public()
@Get()
async findAll() {
  // Anyone can view products
}

@Public()
@Get('featured')
async getFeatured() {
  // Anyone can view featured products
}

@Public()
@Get('count')
async count() {
  // Anyone can see product count
}
```

### Protected Routes (Auth Required) 🔐

```typescript
@Post()
async create(@Body() dto: CreateProductDto) {
  // Only authenticated users can create products
}

@Patch(':id')
async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
  // Only authenticated users can update products
}

@Delete(':id')
async remove(@Param('id') id: string) {
  // Only authenticated users can delete products
}
```

## Usage in Other Controllers

### Example 1: User Controller

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { Public } from 'src/core/decorators';

@Controller('users')
export class UserController {
  // Protected by default
  @Get('profile')
  getProfile() {
    // Requires JWT token
  }

  // Public registration
  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    // No authentication required
  }

  // Public login
  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    // No authentication required
  }
}
```

### Example 2: Category Controller

```typescript
import { Controller, Get, Post } from '@nestjs/common';
import { Public } from 'src/core/decorators';

@Controller('categories')
export class CategoryController {
  // Public - anyone can view categories
  @Public()
  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  // Protected - only authenticated users can create
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }
}
```

## Role-Based Authorization

For routes that require specific user roles, use the `@Roles()` decorator along with `RolesGuard`:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from 'src/core/decorators';
import { RolesGuard } from 'src/core/guards';
import { UserRole } from 'src/shared/enums';

@Controller('admin')
@UseGuards(RolesGuard) // Apply at controller level
export class AdminController {
  @Get('dashboard')
  @Roles(UserRole.ADMIN) // Only admins can access
  getDashboard() {
    // Admin only
  }

  @Get('reports')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR) // Multiple roles
  getReports() {
    // Admins and Moderators can access
  }
}
```

## Authentication Flow

### 1. User Login (Public Route)

```typescript
@Public()
@Post('auth/login')
async login(@Body() credentials: LoginDto) {
  const user = await this.authService.validateUser(credentials);
  const token = await this.authService.generateToken(user);
  return { access_token: token };
}
```

### 2. Client Stores Token

Client receives JWT token and stores it (localStorage, cookie, etc.)

### 3. Subsequent Requests

Client includes token in Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. JWT Strategy Validates Token

The `JwtStrategy` automatically:
- Extracts the token from the header
- Validates the signature
- Decodes the payload
- Attaches user object to `request.user`

### 5. Access User in Controllers

```typescript
import { CurrentUser } from 'src/core/decorators';

@Get('profile')
async getProfile(@CurrentUser() user: any) {
  // user object from JWT payload
  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}
```

## JWT Token Payload Structure

The JWT token should contain:

```typescript
{
  sub: 'user-uuid',           // User ID
  email: 'user@example.com',  // User email
  role: 'user',              // User role
  firstName: 'John',         // Optional
  lastName: 'Doe',          // Optional
  iat: 1699900000,          // Issued at
  exp: 1699990000,          // Expiration
}
```

## Environment Variables

Make sure your `.env` file has:

```env
AUTH_JWT_SECRET=your-super-secret-key-here
AUTH_TOKEN_EXPIRE_TIME=3600
AUTH_TOKEN_EXPIRED_TIME_REMEMBER_ME=604800
AUTH_REFRESH_TOKEN_EXPIRED_TIME=2592000
```

## Error Responses

### 401 Unauthorized (No Token)

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid or missing token",
  "error": "Unauthorized",
  "timestamp": "2024-11-02T10:30:00.000Z",
  "path": "/api/products"
}
```

### 403 Forbidden (Insufficient Role)

```json
{
  "success": false,
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden",
  "timestamp": "2024-11-02T10:30:00.000Z",
  "path": "/api/admin/dashboard"
}
```

## Testing with Swagger

1. Navigate to `http://localhost:3000/docs`
2. Click the **Authorize** button (🔓)
3. Enter: `Bearer YOUR_JWT_TOKEN`
4. Click **Authorize**
5. Now you can test protected routes

## Best Practices

### ✅ DO

- Use `@Public()` for registration, login, and public content
- Keep authentication logic centralized in an auth service
- Validate JWT payloads in the strategy
- Use HTTPS in production
- Rotate JWT secrets regularly
- Set appropriate token expiration times

### ❌ DON'T

- Don't store sensitive data in JWT payload (it's readable!)
- Don't make admin routes public
- Don't use weak JWT secrets
- Don't forget to validate token expiration
- Don't expose JWT tokens in URLs or logs

## Summary

```typescript
// 🔒 PROTECTED BY DEFAULT (requires JWT token)
@Get('products')
async findAll() {}

// 🌐 PUBLIC (no authentication required)
@Public()
@Get('products')
async findAll() {}

// 👑 ROLE-BASED (requires specific role)
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Get('admin/dashboard')
async dashboard() {}

// 👤 ACCESS USER DATA
@Get('profile')
async getProfile(@CurrentUser() user: any) {
  return user; // From JWT payload
}
```

## File Structure

```
src/
├── core/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts      # Global JWT authentication
│   │   ├── jwt.strategy.ts        # JWT token validation
│   │   ├── roles.guard.ts         # Role-based authorization
│   │   └── index.ts
│   └── decorators/
│       ├── public.decorator.ts    # @Public() decorator
│       ├── roles.decorator.ts     # @Roles() decorator
│       ├── current-user.decorator.ts  # @CurrentUser() decorator
│       └── index.ts
└── app.module.ts                  # Global guard registration
```

## Next Steps

1. Create an Auth Module with login/register endpoints
2. Implement refresh token mechanism
3. Add password hashing with bcrypt
4. Set up email verification
5. Implement forgot password flow
6. Add rate limiting for auth endpoints
7. Set up session management
8. Implement 2FA (Two-Factor Authentication)
