# 🚀 NestJS Starter Kit - Complete Features Demo & Guide

**A comprehensive guide for backend developers to understand all implemented features and patterns**

---

## 📚 Table of Contents

1. [Project Architecture](#project-architecture)
2. [Core Features](#core-features)
3. [BaseEntity, BaseRepository, BaseService Pattern](#base-pattern)
4. [BaseController - Automatic CRUD](#basecontroller)
5. [ApiSwagger - Universal Documentation Decorator](#apiswagger)
6. [Authentication & Authorization](#authentication)
7. [Decorators](#decorators)
8. [Filters & Exception Handling](#filters)
9. [Interceptors](#interceptors)
10. [Guards](#guards)
11. [i18n - Multi-Language Support](#i18n---multi-language-support)
12. [Response Layout System](#response-layout-system)
13. [Complete Example Module](#complete-example)
14. [Quick Start Template](#quick-start-template)

---

## 🏗 Project Architecture

### Folder Structure
```
src/
├── config/                 # Configuration files (DB, JWT, Mail, S3)
├── core/                   # Framework-level reusable code
│   ├── base/              # OOP base classes
│   ├── decorators/        # Custom decorators
│   ├── filters/           # Exception handlers
│   ├── guards/            # Route protection
│   ├── interceptors/      # Request/Response modifiers
│   ├── pipes/             # Data validation/transformation
│   └── utils/             # Helper functions
├── shared/                # Business-level shared code
│   ├── constants/
│   ├── dtos/
│   ├── enums/
│   ├── interfaces/
│   └── types/
├── modules/               # Feature modules
│   ├── auth/
│   ├── users/
│   ├── otp/
│   └── [your-module]/
├── infrastructure/        # External services
│   ├── mail/
│   ├── storage/
│   └── cache/
└── database/
    ├── migrations/
    └── seeders/
```

---

## ⚡ Core Features

### 1. **Global Features (Applied Automatically)**

✅ **Global JWT Authentication** - All routes protected by default  
✅ **Global Exception Filter** - Consistent error responses  
✅ **Global Validation Pipe** - Automatic DTO validation  
✅ **Transform Interceptor** - Auto-wrap responses  
✅ **Soft Delete** - Built into BaseEntity  
✅ **Timestamps** - createdAt, updatedAt, deletedAt  
✅ **Multi-Language Support (i18n)** - Automatic language detection  
✅ **Standard Response Layout** - Consistent response structure  

### 2. **Available Decorators**

| Decorator | Purpose | Example |
|-----------|---------|---------|
| `@ApiSwagger()` | Complete Swagger documentation | See section below |
| `@Public()` | Make route public (no auth) | `@Public() @Get()` |
| `@CurrentUser()` | Get authenticated user | `@CurrentUser() user: IJwtPayload` |
| `@Roles()` | Require specific roles | `@Roles('admin', 'moderator')` |

### 3. **Available Interceptors**

| Interceptor | Purpose | Usage |
|-------------|---------|-------|
| `TransformInterceptor` | Auto-wrap responses | Applied globally |
| `LoggingInterceptor` | Log requests/responses | `@UseInterceptors(LoggingInterceptor)` |
| `SetToken` | Set token cookie | `@UseInterceptors(SetToken)` |
| `RemoveToken` | Remove token cookie | `@UseInterceptors(RemoveToken)` |

### 4. **Response DTOs**

| DTO | Status | Usage |
|-----|--------|-------|
| `SuccessResponseDto` | 200 | GET requests |
| `CreatedResponseDto` | 201 | POST requests |
| `UpdatedResponseDto` | 200 | PATCH/PUT requests |
| `DeletedResponseDto` | 200 | DELETE requests |
| `PaginatedResponseDto` | 200 | Paginated lists |
| `ErrorResponseDto` | 4xx/5xx | Error responses |
| `NoContentResponseDto` | 204 | No content responses |

### 5. **i18n Helper Methods**

| Method | Purpose | Example |
|--------|---------|---------|
| `t(key, args?)` | Translate with auto-detection | `i18nHelper.t('translation.success')` |
| `getCurrentLanguage()` | Get current language | `i18nHelper.getCurrentLanguage()` |
| `tWithLang(key, lang, args?)` | Translate with explicit language | `i18nHelper.tWithLang('key', 'ko')` |
| `isLanguage(lang)` | Check if specific language | `i18nHelper.isLanguage('ko')` |
| `getAvailableLanguages()` | Get all languages | `i18nHelper.getAvailableLanguages()` |

---

## 🎯 BaseEntity, BaseRepository, BaseService Pattern

### BaseEntity

**All entities should extend `BaseEntity` to get:**
- `id` (UUID primary key)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)
- `deletedAt` (soft delete timestamp)

```typescript
import { Entity, Column } from 'typeorm';
import { BaseEntity } from 'src/core/base';
import { ApiProperty } from '@nestjs/swagger';

@Entity('products')
export class Product extends BaseEntity {
  @ApiProperty({ example: 'iPhone 15 Pro' })
  @Column()
  name: string;

  @ApiProperty({ example: 999.99 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ example: 50 })
  @Column({ type: 'int', default: 0 })
  stock: number;
}
```

### BaseRepository

**Provides common database operations:**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from 'src/core/base';
import { Product } from './product.entity';

@Injectable()
export class ProductRepository extends BaseRepository<Product> {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {
    super(productRepository);
  }

  // Add custom queries here
  async findFeatured(): Promise<Product[]> {
    return this.productRepository.find({
      where: { isFeatured: true },
    });
  }

  async findByCategory(category: string): Promise<Product[]> {
    return this.productRepository.find({
      where: { category },
    });
  }
}
```

**Available BaseRepository methods:**
- `create(data)` - Create new entity
- `update(id, data)` - Update entity
- `delete(id)` - Hard delete
- `remove(id)` - Soft delete
- `restore(id)` - Restore soft-deleted
- `findAll()` - Get all (including soft-deleted)
- `findById(id)` - Get by ID
- `findByIdOrFail(id)` - Get or throw NotFoundException
- `softDeletedOnly()` - Get only soft-deleted
- `withSoftDeleted()` - Include soft-deleted

### BaseService

**Provides business logic layer:**

```typescript
import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/base';
import { Product } from './product.entity';
import { ProductRepository } from './product.repository';
import { CreateProductDto, UpdateProductDto } from './dtos';

@Injectable()
export class ProductService extends BaseService<Product> {
  constructor(private readonly productRepository: ProductRepository) {
    super(productRepository, 'Product'); // 'Product' is entity name for error messages
  }

  // Custom business logic
  async getFeaturedProducts(): Promise<Product[]> {
    return this.productRepository.findFeatured();
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return this.productRepository.findByCategory(category);
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    const product = await this.findByIdOrFail(id);
    return this.update(id, { stock: product.stock + quantity } as any);
  }
}
```

**Inherited BaseService methods:**
- `create(data)` - Create entity
- `update(id, data)` - Update entity
- `delete(id)` - Hard delete
- `remove(id)` - Soft delete
- `restore(id)` - Restore soft-deleted
- `findAll()` - Get all
- `findById(id)` - Get by ID
- `findByIdOrFail(id)` - Get or throw NotFoundException

---

## 🎮 BaseController - Automatic CRUD

**Extend BaseController to get automatic CRUD endpoints:**

```typescript
import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BaseController } from 'src/core/base';
import { ApiSwagger, Public } from 'src/core/decorators';
import { Product } from './product.entity';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto, ProductResponseDto } from './dtos';

@ApiTags('Products')
@Controller('products')
export class ProductController extends BaseController<
  Product,
  CreateProductDto,
  UpdateProductDto
> {
  constructor(private readonly productService: ProductService) {
    super(productService);
  }

  // ✅ You automatically get these endpoints:
  // POST   /products           - create()
  // GET    /products           - findAll() with pagination
  // GET    /products/:id       - findOne()
  // PATCH  /products/:id       - update()
  // DELETE /products/:id       - remove() (soft delete)

  // Add custom endpoints
  @Public()
  @Get('featured')
  @HttpCode(HttpStatus.OK)
  @ApiSwagger({
    resourceName: 'Products',
    operation: 'custom',
    summary: 'Get featured products',
    responseDto: ProductResponseDto,
    isArray: true,
    requiresAuth: false,
  })
  async getFeatured() {
    return this.productService.getFeaturedProducts();
  }

  @Public()
  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiSwagger({
    resourceName: 'Products',
    operation: 'search',
    summary: 'Search products by name',
    responseDto: ProductResponseDto,
    isArray: true,
    requiresAuth: false,
  })
  async search(@Query('q') query: string) {
    return this.productService.search(query);
  }

  // Override inherited methods if needed
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiSwagger({
    resourceName: 'Product',
    operation: 'getOne',
    responseDto: ProductResponseDto,
    errors: [
      { status: 404, description: 'Product not found' },
    ],
  })
  async findOne(@Param('id') id: string) {
    return super.findOne(id);
  }
}
```

---

## 📝 ApiSwagger - Universal Documentation Decorator

**ONE decorator for ALL Swagger documentation needs!**

### Create Operation
```typescript
@Post()
@HttpCode(HttpStatus.CREATED)
@ApiSwagger({
  resourceName: 'Product',
  operation: 'create',
  requestDto: CreateProductDto,
  responseDto: ProductResponseDto,
  successStatus: 201,
  errors: [
    { status: 400, description: 'Invalid input data' },
    { status: 409, description: 'Product with same SKU already exists' },
  ],
})
async create(@Body() dto: CreateProductDto) {
  return this.service.create(dto);
}
```

### Get All (with Pagination)
```typescript
@Get()
@ApiSwagger({
  resourceName: 'Products',
  operation: 'getAll',
  responseDto: ProductResponseDto,
  isArray: true,
  withPagination: true,
  errors: [
    { status: 401, description: 'Unauthorized' },
  ],
})
async findAll(@Query() query: PaginationDto) {
  return this.service.findAll();
}
```

### Get One
```typescript
@Get(':id')
@ApiSwagger({
  resourceName: 'Product',
  operation: 'getOne',
  responseDto: ProductResponseDto,
  errors: [
    { status: 400, description: 'Invalid UUID format' },
    { status: 404, description: 'Product not found' },
  ],
})
async findOne(@Param('id') id: string) {
  return this.service.findById(id);
}
```

### Update
```typescript
@Patch(':id')
@ApiSwagger({
  resourceName: 'Product',
  operation: 'update',
  requestDto: UpdateProductDto,
  responseDto: ProductResponseDto,
  errors: [
    { status: 400, description: 'Invalid input data' },
    { status: 404, description: 'Product not found' },
  ],
})
async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
  return this.service.update(id, dto);
}
```

### Delete
```typescript
@Delete(':id')
@ApiSwagger({
  resourceName: 'Product',
  operation: 'delete',
  errors: [
    { status: 404, description: 'Product not found' },
  ],
})
async remove(@Param('id') id: string) {
  return this.service.remove(id);
}
```

### Custom Operations
```typescript
@Get('featured')
@ApiSwagger({
  resourceName: 'Products',
  operation: 'custom',
  summary: 'Get featured products',
  responseDto: ProductResponseDto,
  isArray: true,
  requiresAuth: false,
  errors: [
    { status: 500, description: 'Internal server error' },
  ],
})
async getFeatured() {
  return this.service.getFeaturedProducts();
}
```

### ApiSwagger Options

```typescript
interface ApiSwaggerOptions {
  resourceName: string;           // Required: 'User', 'Product', etc.
  operation?: ApiOperationType;   // 'create' | 'getAll' | 'getOne' | 'update' | 'delete' | 'search' | 'count' | 'custom'
  summary?: string;               // Custom summary (auto-generated if not provided)
  requestDto?: Type<any>;         // Request body DTO
  responseDto?: Type<any>;        // Response data DTO
  successStatus?: number;         // HTTP status (default: 200)
  isArray?: boolean;              // Response is array
  requiresAuth?: boolean;         // Requires JWT auth (default: true)
  withPagination?: boolean;       // Add pagination params
  paramName?: string;             // ID param name (default: 'id')
  errors?: ErrorResponseConfig[]; // Error responses
}
```

---

## 🔐 Authentication & Authorization

### Global JWT Authentication

**All routes require authentication by default!**

Configured in `app.module.ts`:
```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
],
```

### Making Routes Public

Use `@Public()` decorator:

```typescript
import { Public } from 'src/core/decorators';

@Public()
@Get('products')
async getAllProducts() {
  // No authentication required
}
```

### Getting Current User

Use `@CurrentUser()` decorator:

```typescript
import { CurrentUser } from 'src/core/decorators';
import { IJwtPayload } from 'src/shared/interfaces';

@Get('profile')
async getProfile(@CurrentUser() user: IJwtPayload) {
  // user contains: { id, email, fullName, role, isActive }
  return user;
}

// Get specific field
@Get('email')
async getEmail(@CurrentUser('email') email: string) {
  return { email };
}
```

### Role-Based Access Control

Use `@Roles()` decorator:

```typescript
import { Roles } from 'src/core/decorators';
import { RolesEnum } from 'src/shared/enums';
import { RolesGuard } from 'src/core/guards';

@UseGuards(RolesGuard)
@Roles(RolesEnum.ADMIN)
@Delete(':id')
async deleteProduct(@Param('id') id: string) {
  // Only admin users can access
}

@UseGuards(RolesGuard)
@Roles(RolesEnum.ADMIN, RolesEnum.MODERATOR)
@Patch(':id/feature')
async featureProduct(@Param('id') id: string) {
  // Admin OR moderator can access
}
```

---

## 🎨 Decorators

### 1. @Public()
**Make route accessible without authentication**

```typescript
@Public()
@Get('public-data')
async getPublicData() {
  return { message: 'No auth required' };
}
```

### 2. @CurrentUser()
**Get authenticated user from request**

```typescript
@Get('me')
async getCurrentUser(@CurrentUser() user: IJwtPayload) {
  return user;
}

// Get specific property
@Get('user-id')
async getUserId(@CurrentUser('id') userId: string) {
  return { userId };
}
```

### 3. @Roles()
**Require specific roles** (must use with RolesGuard)

```typescript
@UseGuards(RolesGuard)
@Roles('admin', 'moderator')
@Post('admin-action')
async adminAction() {
  return { message: 'Admin only' };
}
```

### 4. @ApiSwagger()
**Complete Swagger documentation** (see dedicated section above)

```typescript
@ApiSwagger({
  resourceName: 'Product',
  operation: 'create',
  requestDto: CreateProductDto,
  responseDto: ProductResponseDto,
})
```

---

## 🛡️ Filters & Exception Handling

### HttpExceptionFilter

**Automatically formats all exceptions consistently:**

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Product not found",
  "error": {
    "error": "Not Found",
    "errors": []
  },
  "path": "/api/products/123",
  "timestamp": "2024-11-06T10:30:00.000Z"
}
```

### Throwing Exceptions in Services

**Always throw HTTP exceptions in services:**

```typescript
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

@Injectable()
export class ProductService extends BaseService<Product> {
  async findByIdOrFail(id: string): Promise<Product> {
    const product = await this.findById(id);
    
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    // Check for duplicates
    const existing = await this.repository.findBySku(dto.sku);
    if (existing) {
      throw new ConflictException('Product with same SKU already exists');
    }

    // Validation
    if (dto.price < 0) {
      throw new BadRequestException('Price cannot be negative');
    }

    try {
      return await this.repository.create(dto);
    } catch (error) {
      throw new InternalServerErrorException('Failed to create product');
    }
  }
}
```

**❌ DON'T return error objects:**
```typescript
// BAD
return { success: false, message: 'Product not found' };
```

**✅ DO throw exceptions:**
```typescript
// GOOD
throw new NotFoundException('Product not found');
```

---

## 🔄 Interceptors

### 1. TransformInterceptor
**Auto-wraps all responses in ResponsePayloadDto**

```typescript
// Your controller returns:
return { id: '123', name: 'Product' };

// TransformInterceptor wraps it:
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "123",
    "name": "Product"
  }
}
```

Applied globally in `main.ts`.

### 2. LoggingInterceptor
**Logs request/response details with execution time**

The `LoggingInterceptor` automatically logs:
- **Incoming Request**: HTTP method, URL, request body
- **Response**: HTTP method, URL, status code, execution time (ms)

#### Use Cases:
1. **Debug API issues** - See exactly what data is being sent/received
2. **Performance monitoring** - Track response times for slow endpoints
3. **Audit trail** - Keep logs of critical operations
4. **Development debugging** - Understand request/response flow

#### Examples:

**Method-Level Logging** (recommended for specific endpoints):
```typescript
import { UseInterceptors } from '@nestjs/common';
import { LoggingInterceptor } from 'src/core/interceptors';

// Log only critical endpoints
@UseInterceptors(LoggingInterceptor)
@Post('payment')
async processPayment(@Body() dto: PaymentDto) {
  // Logs: 
  // [LoggingInterceptor] Incoming Request: POST /api/payment - Body: {"amount":100,"method":"card"}
  // [LoggingInterceptor] Response: POST /api/payment - Status: 200 - 1234ms
  return this.paymentService.process(dto);
}

// Log admin actions for audit trail
@UseInterceptors(LoggingInterceptor)
@Roles('admin')
@Delete('user/:id')
async deleteUser(@Param('id') id: string) {
  // Logs admin deletion operations
  return this.userService.remove(id);
}
```

**Controller-Level Logging** (applies to all endpoints in controller):
```typescript
@Controller('orders')
@UseInterceptors(LoggingInterceptor)
export class OrderController {
  // All endpoints in this controller will be logged
  
  @Post()
  async create(@Body() dto: CreateOrderDto) {
    return this.orderService.create(dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }
}
```

**Global Logging** (applies to all routes - configure in main.ts):
```typescript
// main.ts
import { LoggingInterceptor } from 'src/core/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Apply logging to ALL routes (use with caution - can be verbose)
  app.useGlobalInterceptors(new LoggingInterceptor());
  
  await app.listen(3000);
}
```

**Selective Logging** (mix logged and non-logged endpoints):
```typescript
@Controller('products')
export class ProductController {
  // Public endpoint - no logging (to reduce noise)
  @Public()
  @Get()
  async findAll() {
    return this.productService.findAll();
  }

  // Critical operation - log it
  @UseInterceptors(LoggingInterceptor)
  @Post()
  async create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  // Admin operation - log for audit
  @UseInterceptors(LoggingInterceptor)
  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
```

#### Console Output Example:

**Success Responses:**
```
[LoggingInterceptor] Incoming Request: POST /api/products - Body: {"name":"iPhone 15","price":999}
[LoggingInterceptor] Response: POST /api/products - Status: 201 - 145ms

[LoggingInterceptor] Incoming Request: GET /api/products/123 - Body: {}
[LoggingInterceptor] Response: GET /api/products/123 - Status: 200 - 23ms

[LoggingInterceptor] Incoming Request: DELETE /api/products/123 - Body: {}
[LoggingInterceptor] Response: DELETE /api/products/123 - Status: 200 - 78ms
```

#### ⚠️ Important Limitation:

**The current `LoggingInterceptor` does NOT log errors!**

When an exception occurs, only the "Incoming Request" is logged, but the error response is NOT logged because it uses the `tap()` RxJS operator which only handles successful responses.

**Example - What you'll see:**
```typescript
// Request that fails
@UseInterceptors(LoggingInterceptor)
@Get(':id')
async findOne(@Param('id') id: string) {
  throw new NotFoundException('Product not found');
}

// Console output:
[LoggingInterceptor] Incoming Request: GET /api/products/999 - Body: {}
// ❌ No "Response" log - error is not logged!
// Error is handled by HttpExceptionFilter instead
```

**To log errors as well, you can enhance the interceptor:**

```typescript
// Enhanced version with error logging (modify logging.interceptor.ts)
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const { method, url, body } = request;
    const now = Date.now();

    this.logger.log(
      `Incoming Request: ${method} ${url} - Body: ${JSON.stringify(body)}`,
    );

    return next.handle().pipe(
      tap(() => {
        const response = ctx.getResponse();
        const { statusCode } = response;
        const responseTime = Date.now() - now;

        this.logger.log(
          `Response: ${method} ${url} - Status: ${statusCode} - ${responseTime}ms`,
        );
      }),
      // Add error logging
      catchError((error) => {
        const responseTime = Date.now() - now;
        const status = error?.status || 500;
        
        this.logger.error(
          `Error: ${method} ${url} - Status: ${status} - ${responseTime}ms - ${error.message}`,
        );
        
        return throwError(() => error);
      }),
    );
  }
}
```

**With error logging enabled, you'll see:**
```
[LoggingInterceptor] Incoming Request: GET /api/products/999 - Body: {}
[LoggingInterceptor] Error: GET /api/products/999 - Status: 404 - 23ms - Product not found
```

#### Best Practices:

✅ **DO:**
- Use for critical business operations (payments, deletions, admin actions)
- Use for debugging slow endpoints
- Use for audit trails
- Apply selectively to reduce log noise

❌ **DON'T:**
- Apply globally in production (creates massive logs)
- Use on high-traffic public endpoints (list, search)
- Log endpoints with sensitive data (passwords, tokens) - sanitize first

### 3. SetToken Interceptor
**Sets JWT token in HTTP-only cookie**

```typescript
@Post('login')
@UseInterceptors(SetToken)
async login(@Body() dto: LoginDto) {
  // Token automatically set in cookie
  return this.authService.login(dto);
}
```

### 4. RemoveToken Interceptor
**Removes JWT token cookie**

```typescript
@Get('logout')
@UseInterceptors(RemoveToken)
async logout() {
  // Token automatically removed from cookie
}
```

---

## 🛡️ Guards

### 1. JwtAuthGuard
**Applied globally - protects all routes by default**

```typescript
// Configured in app.module.ts
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
],
```

Use `@Public()` to bypass.

### 2. RolesGuard
**Check user roles**

```typescript
@UseGuards(RolesGuard)
@Roles('admin')
@Delete(':id')
async deleteProduct() {
  // Only users with 'admin' role
}
```

---

## 📦 Complete Example Module

Here's a complete example showing ALL features:

### 1. DTOs

**create-product.dto.ts**
```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  Length,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 15 Pro', description: 'Product name' })
  @IsString()
  @Length(3, 255)
  name: string;

  @ApiPropertyOptional({ example: 'Latest iPhone' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 999.99, description: 'Price in USD' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 50, description: 'Stock quantity' })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ example: 'Electronics' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: 'PROD-12345' })
  @IsOptional()
  @IsString()
  sku?: string;
}
```

**update-product.dto.ts**
```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

**product-response.dto.ts**
```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'iPhone 15 Pro' })
  name: string;

  @ApiPropertyOptional({ example: 'Latest iPhone' })
  description?: string;

  @ApiProperty({ example: 999.99 })
  price: number;

  @ApiProperty({ example: 50 })
  stock: number;

  @ApiPropertyOptional({ example: 'Electronics' })
  category?: string;

  @ApiProperty({ example: false })
  isFeatured: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: 'PROD-12345' })
  sku?: string;

  @ApiProperty({ example: '2024-11-06T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-11-06T10:30:00.000Z' })
  updatedAt: Date;
}
```

### 2. Complete Controller Example

**product.controller.ts**
```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BaseController } from 'src/core/base';
import {
  ApiSwagger,
  Public,
  CurrentUser,
  Roles,
} from 'src/core/decorators';
import { RolesGuard } from 'src/core/guards';
import { RolesEnum } from 'src/shared/enums';
import { IJwtPayload } from 'src/shared/interfaces';
import { Product } from './product.entity';
import { ProductService } from './product.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
} from './dtos';

/**
 * Product Controller
 * 
 * Demonstrates ALL features:
 * ✅ BaseController inheritance (automatic CRUD)
 * ✅ @ApiSwagger decorator (documentation)
 * ✅ @Public() decorator (public routes)
 * ✅ @CurrentUser() decorator (get authenticated user)
 * ✅ @Roles() decorator (role-based access)
 * ✅ Custom endpoints
 * ✅ Proper error documentation
 */
@ApiTags('Products')
@Controller('products')
export class ProductController extends BaseController<
  Product,
  CreateProductDto,
  UpdateProductDto
> {
  constructor(private readonly productService: ProductService) {
    super(productService);
  }

  /**
   * 🔓 PUBLIC: Create Product (anyone can create)
   */
  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiSwagger({
    resourceName: 'Product',
    operation: 'create',
    requestDto: CreateProductDto,
    responseDto: ProductResponseDto,
    successStatus: 201,
    requiresAuth: false,
    errors: [
      { status: 400, description: 'Invalid input data' },
      { status: 409, description: 'Product with same SKU already exists' },
    ],
  })
  async create(@Body() dto: CreateProductDto) {
    return super.create(dto);
  }

  /**
   * 🔓 PUBLIC: Get All Products with Pagination
   */
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiSwagger({
    resourceName: 'Products',
    operation: 'getAll',
    responseDto: ProductResponseDto,
    isArray: true,
    withPagination: true,
    requiresAuth: false,
  })
  async findAll(@Query() query: any) {
    return super.findAll(query);
  }

  /**
   * 🔓 PUBLIC: Get Product by ID
   */
  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiSwagger({
    resourceName: 'Product',
    operation: 'getOne',
    responseDto: ProductResponseDto,
    requiresAuth: false,
    errors: [
      { status: 400, description: 'Invalid UUID format' },
      { status: 404, description: 'Product not found' },
    ],
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return super.findOne(id);
  }

  /**
   * 🔐 PROTECTED: Update Product (requires authentication)
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiSwagger({
    resourceName: 'Product',
    operation: 'update',
    requestDto: UpdateProductDto,
    responseDto: ProductResponseDto,
    requiresAuth: true,
    errors: [
      { status: 400, description: 'Invalid input data or UUID format' },
      { status: 401, description: 'Unauthorized' },
      { status: 404, description: 'Product not found' },
    ],
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: IJwtPayload,
  ) {
    // You have access to authenticated user
    console.log('Updated by:', user.email);
    return super.update(id, dto);
  }

  /**
   * 🔐 ADMIN ONLY: Delete Product (requires admin role)
   */
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiSwagger({
    resourceName: 'Product',
    operation: 'delete',
    requiresAuth: true,
    errors: [
      { status: 400, description: 'Invalid UUID format' },
      { status: 401, description: 'Unauthorized' },
      { status: 403, description: 'Forbidden - Admin access required' },
      { status: 404, description: 'Product not found' },
    ],
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: IJwtPayload,
  ) {
    console.log('Deleted by admin:', user.email);
    return super.remove(id);
  }

  /**
   * 🔓 PUBLIC: Get Featured Products
   * CUSTOM ENDPOINT - Not from BaseController
   */
  @Public()
  @Get('featured')
  @HttpCode(HttpStatus.OK)
  @ApiSwagger({
    resourceName: 'Products',
    operation: 'custom',
    summary: 'Get featured products',
    responseDto: ProductResponseDto,
    isArray: true,
    requiresAuth: false,
  })
  async getFeatured() {
    return this.productService.getFeaturedProducts();
  }

  /**
   * 🔓 PUBLIC: Search Products
   * CUSTOM ENDPOINT
   */
  @Public()
  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiSwagger({
    resourceName: 'Products',
    operation: 'search',
    summary: 'Search products by name or description',
    responseDto: ProductResponseDto,
    isArray: true,
    requiresAuth: false,
  })
  async search(@Query('q') query: string) {
    if (!query) {
      return [];
    }
    return this.productService.search(query);
  }

  /**
   * 🔓 PUBLIC: Count Products
   * CUSTOM ENDPOINT
   */
  @Public()
  @Get('count')
  @HttpCode(HttpStatus.OK)
  @ApiSwagger({
    resourceName: 'Products',
    operation: 'count',
    summary: 'Get total product count',
    requiresAuth: false,
  })
  async count() {
    return super.count();
  }

  /**
   * 🔐 PROTECTED: Get My Created Products
   * Uses @CurrentUser() to get authenticated user
   */
  @Get('my-products')
  @HttpCode(HttpStatus.OK)
  @ApiSwagger({
    resourceName: 'Products',
    operation: 'custom',
    summary: 'Get products created by current user',
    responseDto: ProductResponseDto,
    isArray: true,
    requiresAuth: true,
    errors: [
      { status: 401, description: 'Unauthorized' },
    ],
  })
  async getMyProducts(@CurrentUser() user: IJwtPayload) {
    // Use user.id to filter products
    return this.productService.getProductsByUser(user.id);
  }

  /**
   * 🔐 MODERATOR/ADMIN: Feature/Unfeature Product
   * Uses @Roles() for role-based access
   */
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN, RolesEnum.MODERATOR)
  @Patch(':id/feature')
  @HttpCode(HttpStatus.OK)
  @ApiSwagger({
    resourceName: 'Product',
    operation: 'custom',
    summary: 'Toggle product featured status',
    responseDto: ProductResponseDto,
    requiresAuth: true,
    errors: [
      { status: 401, description: 'Unauthorized' },
      { status: 403, description: 'Forbidden - Moderator or Admin access required' },
      { status: 404, description: 'Product not found' },
    ],
  })
  async toggleFeatured(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: IJwtPayload,
  ) {
    console.log('Featured toggled by:', user.role, user.email);
    return this.productService.toggleFeatured(id);
  }
}
```

---

## 🎓 Usage Examples

### Example 1: Simple Public API
```typescript
@Public()
@Get()
@ApiSwagger({
  resourceName: 'Products',
  operation: 'getAll',
  responseDto: ProductResponseDto,
  isArray: true,
  requiresAuth: false,
})
async findAll() {
  return this.service.findAll();
}
```

### Example 2: Protected with User Access
```typescript
@Get('profile')
@ApiSwagger({
  resourceName: 'Profile',
  operation: 'custom',
  summary: 'Get user profile',
  responseDto: UserResponseDto,
  requiresAuth: true,
})
async getProfile(@CurrentUser() user: IJwtPayload) {
  return this.userService.getProfile(user.id);
}
```

### Example 3: Admin-Only Endpoint
```typescript
@UseGuards(RolesGuard)
@Roles('admin')
@Delete(':id')
@ApiSwagger({
  resourceName: 'User',
  operation: 'delete',
  requiresAuth: true,
  errors: [
    { status: 403, description: 'Admin access required' },
    { status: 404, description: 'User not found' },
  ],
})
async deleteUser(@Param('id') id: string) {
  return this.service.remove(id);
}
```

---

## ✅ Checklist for New Modules

When creating a new module, ensure you:

- [ ] Entity extends `BaseEntity`
- [ ] Repository extends `BaseRepository`
- [ ] Service extends `BaseService`
- [ ] Controller extends `BaseController` (for CRUD)
- [ ] Use `@ApiSwagger` for all endpoints
- [ ] Use `@Public()` for public routes
- [ ] Use `@CurrentUser()` when you need user info
- [ ] Use `@Roles()` + `RolesGuard` for role-based access
- [ ] Throw HTTP exceptions in services (not return error objects)
- [ ] Create Response DTOs with `@ApiProperty`
- [ ] Validate input with class-validator decorators
- [ ] Document errors in `@ApiSwagger` decorator

---

## 🌍 i18n - Multi-Language Support

### Automatic Language Detection

The project uses **automatic language detection** - no need to pass language parameters!

#### How It Works:

Language is automatically detected in this priority order:
1. **Query parameter**: `?lang=ko`
2. **Accept-Language header**: `Accept-Language: ko`
3. **Default fallback**: English (`en`)

#### Configuration:

Already configured in `app.module.ts`:
```typescript
I18nModule.forRoot({
  fallbackLanguage: 'en',
  loaderOptions: {
    path: join(process.cwd(), 'src/i18n'),
    watch: true,
  },
  resolvers: [
    { use: QueryResolver, options: ['lang'] },  // Checks ?lang=en
    AcceptLanguageResolver,                      // Checks Accept-Language header
  ],
})
```

#### Using I18nHelper in Services:

```typescript
import { I18nHelper } from '@core/utils';

@Injectable()
export class ProductService extends BaseService<Product> {
  constructor(
    repository: ProductRepository,
    private readonly i18nHelper: I18nHelper,
  ) {
    super(repository, 'Product');
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const product = await this.repository.create(dto);
    
    if (!product) {
      throw new BadRequestException(
        this.i18nHelper.t('translation.product.error.create_failed')
        // ✅ Automatically uses language from request context
      );
    }

    // With variables
    return {
      message: this.i18nHelper.t('translation.product.success.created', {
        name: product.name,
      }),
      data: product,
    };
  }

  async findAll() {
    const products = await this.repository.findAll();
    
    return {
      message: this.i18nHelper.t('translation.product.success.found'),
      data: products,
    };
  }
}
```

#### I18nHelper Methods:

```typescript
// 1. Automatic translation (from request context)
this.i18nHelper.t('translation.success.created');

// 2. With variables
this.i18nHelper.t('translation.error.not_found', { id: '123' });

// 3. Get current language
const lang = this.i18nHelper.getCurrentLanguage(); // 'en' or 'ko'

// 4. Check if specific language
if (this.i18nHelper.isLanguage('ko')) {
  // Korean-specific logic
}

// 5. For background jobs (no request context)
this.i18nHelper.tWithLang('translation.email.subject', 'ko', { name: 'John' });

// 6. Get available languages
const languages = this.i18nHelper.getAvailableLanguages(); // ['en', 'ko']
```

#### Client Usage Examples:

```bash
# 1. English (default - no language specified)
GET /api/products
Response: { "message": "Products retrieved successfully" }

# 2. Korean (query parameter)
GET /api/products?lang=ko
Response: { "message": "제품을 성공적으로 조회했습니다" }

# 3. Korean (header)
GET /api/products
Header: Accept-Language: ko
Response: { "message": "제품을 성공적으로 조회했습니다" }
```

#### Translation Files Structure:

```
src/i18n/
├── en/
│   └── translation.json
└── ko/
    └── translation.json
```

**Example `en/translation.json`:**
```json
{
  "authentication": {
    "success": {
      "login": "Login successful",
      "logout": "Logout successful"
    },
    "error": {
      "user_not_found": "User not found",
      "invalid_credentials": "Invalid credentials"
    }
  },
  "product": {
    "success": {
      "created": "Product {{name}} created successfully",
      "found": "Products retrieved successfully"
    },
    "error": {
      "create_failed": "Failed to create product",
      "not_found": "Product not found"
    }
  }
}
```

#### Key Benefits:

✅ **No Controller Changes** - No `@Query('lang')` parameters needed  
✅ **Clean Code** - No language parameters in service methods  
✅ **Automatic** - Language detection is fully automatic  
✅ **Type Safe** - Uses LanguageEnum for available languages  
✅ **Flexible** - Supports query params, headers, and defaults  

**For complete migration guide, see:** `I18N-MIGRATION-GUIDE.md`

---

## 📦 Response Layout System

### Standard Response Structure

All API responses follow a consistent structure using `ResponsePayloadDto`. This ensures uniformity across all endpoints.

#### Base Response DTO:

```typescript
import { ResponsePayloadDto } from 'src/shared/dtos';

/**
 * Standard API Response Layout
 * All responses follow this structure
 */
export class ResponsePayloadDto<T = any> {
  success: boolean;        // Indicates if request was successful
  statusCode: number;      // HTTP status code (200, 201, 400, etc.)
  message: string;         // Human-readable message
  data?: T;               // Response data (optional)
  error?: ErrorDetailDto[]; // Error details (only on errors)
  timestamp?: string;      // ISO timestamp
  path?: string;          // Request path
}
```

### Helper Response DTOs (Optional Convenience Wrappers)

While you can use `ResponsePayloadDto` directly, these helper classes are available for convenience:

```typescript
import {
  SuccessResponseDto,      // 200 - GET requests
  CreatedResponseDto,      // 201 - POST requests
  UpdatedResponseDto,      // 200 - PATCH/PUT requests
  DeletedResponseDto,      // 200 - DELETE requests
  PaginatedResponseDto,    // 200 - Paginated lists
  ErrorResponseDto,        // 4xx/5xx - Errors
  NoContentResponseDto,    // 204 - No content
} from 'src/shared/dtos';
```

### ✅ Recommended Pattern: Using ResponsePayloadDto Directly

For maximum clarity and consistency, use `ResponsePayloadDto` directly in both return types and implementations.

#### Example 1: GET Request (200 OK)

```typescript
@Get(':id')
async findOne(@Param('id') id: string): Promise<ResponsePayloadDto<Product>> {
  const product = await this.service.findById(id);
  return new ResponsePayloadDto({
    success: true,
    statusCode: 200,
    message: 'Product retrieved successfully',
    data: product,
    timestamp: new Date().toISOString(),
  });
}

// Response:
{
  "success": true,
  "statusCode": 200,
  "message": "Product retrieved successfully",
  "data": {
    "id": "123",
    "name": "iPhone 15"
  },
  "timestamp": "2024-11-06T10:30:00.000Z"
}
```

#### Example 2: POST Request (201 Created)

```typescript
@Post()
@HttpCode(HttpStatus.CREATED)
async create(@Body() dto: CreateProductDto): Promise<ResponsePayloadDto<Product>> {
  const product = await this.service.create(dto);
  return new ResponsePayloadDto({
    success: true,
    statusCode: 201,
    message: 'Product created successfully',
    data: product,
    timestamp: new Date().toISOString(),
  });
}

// Response:
{
  "success": true,
  "statusCode": 201,
  "message": "Product created successfully",
  "data": {
    "id": "123",
    "name": "iPhone 15"
  },
  "timestamp": "2024-11-06T10:30:00.000Z"
}
```

#### Example 3: PATCH Request (200 Updated)

```typescript
@Patch(':id')
async update(
  @Param('id') id: string,
  @Body() dto: UpdateProductDto
): Promise<ResponsePayloadDto<Product>> {
  const product = await this.service.update(id, dto);
  return new ResponsePayloadDto({
    success: true,
    statusCode: 200,
    message: 'Product updated successfully',
    data: product,
    timestamp: new Date().toISOString(),
  });
}

// Response:
{
  "success": true,
  "statusCode": 200,
  "message": "Product updated successfully",
  "data": {
    "id": "123",
    "name": "iPhone 15 Pro"
  },
  "timestamp": "2024-11-06T10:30:00.000Z"
}
```

#### Example 4: DELETE Request (200 Deleted)

```typescript
@Delete(':id')
async remove(@Param('id') id: string): Promise<ResponsePayloadDto<void>> {
  await this.service.remove(id);
  return new ResponsePayloadDto({
    success: true,
    statusCode: 200,
    message: 'Product deleted successfully',
    timestamp: new Date().toISOString(),
  });
}

// Response:
{
  "success": true,
  "statusCode": 200,
  "message": "Product deleted successfully",
  "timestamp": "2024-11-06T10:30:00.000Z"
}
```

#### Example 5: Authentication Response

```typescript
async login(userLogin: LoginDto): Promise<ResponsePayloadDto<LoginResponsePayloadDto>> {
  // ... authentication logic ...
  
  const data = {
    token: this.tokenService.getAccessToken(payload, userLogin.rememberMe),
    refreshToken,
    user: {
      id: userData.id,
      fullName: userData.fullName,
      email: userData.email,
      role: userData.role,
      isActive: true,
    },
  };
  
  return new ResponsePayloadDto({
    success: true,
    statusCode: 200,
    message: 'Access granted',
    data,
    timestamp: new Date().toISOString(),
  });
}

// Response:
{
  "success": true,
  "statusCode": 200,
  "message": "Access granted",
  "data": {
    "token": "eyJhbGciOiJIUzI1...",
    "refreshToken": "eyJhbGciOiJSZWZyZXNo...",
    "user": {
      "id": "uuid",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "MEMBER",
      "isActive": true
    }
  },
  "timestamp": "2024-11-06T10:30:00.000Z"
}
```

### 🔧 Alternative: Using Helper Classes (Optional)

If you prefer shorter syntax, you can use the helper classes:

```typescript
// Using SuccessResponseDto
@Get(':id')
async findOne(@Param('id') id: string) {
  const product = await this.service.findById(id);
  return new SuccessResponseDto(product, 'Product retrieved successfully');
}

// Using CreatedResponseDto
@Post()
async create(@Body() dto: CreateProductDto) {
  const product = await this.service.create(dto);
  return new CreatedResponseDto(product, 'Product created successfully');
}

// Using UpdatedResponseDto
@Patch(':id')
async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
  const product = await this.service.update(id, dto);
  return new UpdatedResponseDto(product, 'Product updated successfully');
}

// Using DeletedResponseDto
@Delete(':id')
async remove(@Param('id') id: string) {
  await this.service.remove(id);
  return new DeletedResponseDto('Product deleted successfully');
}
```

### 📝 Benefits of Using ResponsePayloadDto Directly

1. **✅ Consistency**: Return type matches implementation (`Promise<ResponsePayloadDto<T>>` → `new ResponsePayloadDto(...)`)
2. **✅ Clarity**: Explicit about all fields being set
3. **✅ Flexibility**: Full control over statusCode, message, and other fields
4. **✅ Maintainability**: Less confusion about which helper to use
5. **✅ Type Safety**: Better IDE autocomplete and type checking

### 🔄 Automatic Response Wrapping

The global `TransformInterceptor` automatically wraps plain objects in `ResponsePayloadDto`:

```typescript
// If you return a plain object
@Get(':id')
async findOne(@Param('id') id: string) {
  return await this.service.findById(id);  // Plain object
}

// It's automatically wrapped to:
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { /* your object */ },
  "timestamp": "2024-11-06T10:30:00.000Z",
  "path": "/api/products/123"
}
```

### 6. **PaginatedResponseDto** - Paginated lists

```typescript
@Get()
async findAll(@Query() pagination: PaginationDto) {
  const { data, total } = await this.service.findAllPaginated(pagination);
  
  return new PaginatedResponseDto(
    data,
    pagination.page,
    pagination.limit,
    total,
    'Products retrieved successfully'
  );
}

// Response:
{
  "success": true,
  "statusCode": 200,
  "message": "Products retrieved successfully",
  "data": [
    { "id": "1", "name": "iPhone 15" },
    { "id": "2", "name": "Samsung Galaxy" }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "timestamp": "2024-11-06T10:30:00.000Z",
  "path": "/api/products"
}
```

### 6. **ErrorResponseDto** - Error responses (4xx, 5xx)

```typescript
// Automatically handled by HttpExceptionFilter
throw new NotFoundException('Product not found');

// Response:
{
  "success": false,
  "statusCode": 404,
  "message": "Product not found",
  "error": {
    "statusCode": 404,
    "error": "Not Found",
    "method": "GET"
  },
  "timestamp": "2024-11-06T10:30:00.000Z",
  "path": "/api/products/999"
}
```

### 7. **NoContentResponseDto** - 204 No Content

```typescript
@Delete(':id')
@HttpCode(HttpStatus.NO_CONTENT)
async remove(@Param('id') id: string) {
  await this.service.remove(id);
  return new NoContentResponseDto();
}

// Response: Empty body with 204 status
```

### BaseController Automatic Usage

When extending `BaseController`, all CRUD methods automatically return the appropriate response DTOs:

```typescript
@Controller('products')
export class ProductController extends BaseController<
  Product,
  CreateProductDto,
  UpdateProductDto
> {
  constructor(service: ProductService) {
    super(service);
  }

  // ✅ Inherited methods automatically use response DTOs:
  // create()  → CreatedResponseDto (201)
  // findAll() → PaginatedResponseDto (200)
  // findOne() → SuccessResponseDto (200)
  // update()  → UpdatedResponseDto (200)
  // remove()  → DeletedResponseDto (200)
}
```

### Custom Response Messages with i18n

Combine Response DTOs with I18nHelper for multi-language messages:

```typescript
@Injectable()
export class ProductService extends BaseService<Product> {
  constructor(
    repository: ProductRepository,
    private readonly i18nHelper: I18nHelper,
  ) {
    super(repository, 'Product');
  }

  async create(dto: CreateProductDto) {
    const product = await this.repository.create(dto);
    
    // Response DTO with i18n message
    return new CreatedResponseDto(
      product,
      this.i18nHelper.t('translation.product.success.created', {
        name: product.name,
      })
    );
  }

  async findAll(pagination: PaginationDto) {
    const { data, total } = await this.repository.findAllPaginated(pagination);
    
    return new PaginatedResponseDto(
      data,
      pagination.page,
      pagination.limit,
      total,
      this.i18nHelper.t('translation.product.success.found')
    );
  }
}
```

### PaginationDto Usage

```typescript
import { PaginationDto } from 'src/shared/dtos';

@Get()
async findAll(@Query() pagination: PaginationDto) {
  // PaginationDto automatically handles:
  // - page (default: 1)
  // - limit (default: 10)
  // - sortBy (optional)
  // - sortOrder (optional: 'ASC' | 'DESC')
  
  return await this.service.findAll(pagination);
}

// Client request:
// GET /api/products?page=2&limit=20&sortBy=createdAt&sortOrder=DESC
```

### Response Layout Benefits:

✅ **Consistency** - All APIs follow the same structure  
✅ **Type Safety** - Full TypeScript support with generics  
✅ **Swagger Integration** - Automatic API documentation  
✅ **Pagination Ready** - Built-in pagination metadata  
✅ **Error Handling** - Unified error response format  
✅ **Flexible** - Use with BaseController or custom endpoints  
✅ **i18n Compatible** - Works seamlessly with multi-language messages  

**For complete guide, see:** `RESPONSE-LAYOUT-GUIDE.md`

---

## 🚀 Quick Start Template

Copy this template to create a new module quickly:

```typescript
// 1. Entity
import { Entity, Column } from 'typeorm';
import { BaseEntity } from 'src/core/base';

@Entity('items')
export class Item extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;
}

// 2. Repository
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from 'src/core/base';

@Injectable()
export class ItemRepository extends BaseRepository<Item> {
  constructor(@InjectRepository(Item) repo: Repository<Item>) {
    super(repo);
  }
}

// 3. Service
import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/base';
import { I18nHelper } from '@core/utils';
import { 
  CreatedResponseDto, 
  SuccessResponseDto, 
  PaginatedResponseDto 
} from 'src/shared/dtos';

@Injectable()
export class ItemService extends BaseService<Item> {
  constructor(
    repo: ItemRepository,
    private readonly i18nHelper: I18nHelper,
  ) {
    super(repo, 'Item');
  }

  // Override create to add i18n message
  async create(dto: CreateItemDto) {
    const item = await this.repository.create(dto);
    
    return new CreatedResponseDto(
      item,
      this.i18nHelper.t('translation.item.success.created', {
        name: item.name,
      })
    );
  }

  // Override findAll to add i18n message
  async findAll(pagination: PaginationDto) {
    const { data, total } = await this.repository.findAllPaginated(pagination);
    
    return new PaginatedResponseDto(
      data,
      pagination.page,
      pagination.limit,
      total,
      this.i18nHelper.t('translation.item.success.found')
    );
  }
}

// 4. Controller
import { Controller } from '@nestjs/common';
import { BaseController } from 'src/core/base';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Items')
@Controller('items')
export class ItemController extends BaseController<
  Item,
  CreateItemDto,
  UpdateItemDto
> {
  constructor(service: ItemService) {
    super(service);
  }
  
  // All CRUD methods inherited from BaseController:
  // ✅ create()  - Returns CreatedResponseDto with i18n message
  // ✅ findAll() - Returns PaginatedResponseDto with i18n message
  // ✅ findOne() - Returns SuccessResponseDto
  // ✅ update()  - Returns UpdatedResponseDto
  // ✅ remove()  - Returns DeletedResponseDto
}

// 5. DTOs
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min } from 'class-validator';

export class CreateItemDto {
  @ApiProperty({ example: 'Laptop' })
  @IsString()
  name: string;

  @ApiProperty({ example: 999.99 })
  @IsNumber()
  @Min(0)
  price: number;
}

export class UpdateItemDto extends PartialType(CreateItemDto) {}

// 6. Module
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Item])],
  controllers: [ItemController],
  providers: [ItemService, ItemRepository],
  exports: [ItemService],
})
export class ItemModule {}
```

### Features Demonstrated:

✅ **BaseEntity** - Automatic id, timestamps, soft delete  
✅ **BaseRepository** - Common database operations  
✅ **BaseService** - Business logic with i18n support  
✅ **BaseController** - Automatic CRUD endpoints  
✅ **I18nHelper** - Multi-language messages  
✅ **Response DTOs** - Consistent response structure  
✅ **Validation** - class-validator decorators  
✅ **Swagger** - ApiProperty documentation  

---

## 📚 Additional Resources

- **Error Handling:** See `ERROR-HANDLING-GUIDE.md`
- **Authentication:** See `AUTHENTICATION-GUIDE.md`
- **BaseController:** See `BASE-CONTROLLER-GUIDE.md`
- **ApiSwagger:** See `ONE-DECORATOR-GUIDE.md`
- **Transforms:** See `TRANSFORM-INTERCEPTOR-GUIDE.md`
- **i18n Migration:** See `I18N-MIGRATION-GUIDE.md`
- **Response Layout:** See `RESPONSE-LAYOUT-GUIDE.md`
- **Response System:** See `RESPONSE-SYSTEM-SUMMARY.md`

---

**🎉 You're now ready to build features with all the implemented patterns!**

For questions or issues, refer to the individual guide files or check existing modules (users, auth, otp) for real examples.
