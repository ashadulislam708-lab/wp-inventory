# TransformInterceptor Usage Guide

## What is TransformInterceptor?

`TransformInterceptor` is a **global interceptor** that automatically wraps ALL controller responses in the standard `ResponsePayloadDto ` format. This eliminates the need to manually create response DTOs in every method.

## 🎯 Use Cases

### 1. **Module-Level Interceptor** (Recommended for specific modules)
Apply interceptor to a specific module only.

```typescript
// product.module.ts
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from 'src/core/interceptors';

@Module({
  providers: [
    ProductService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class ProductModule {}
```

### 2. **Global Interceptor** (Apply to entire application)
```typescript
// main.ts
import { TransformInterceptor } from './core/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new TransformInterceptor());
  await app.listen(3000);
}
```

### 3. **Controller-Level Interceptor** (Apply to specific controller)
```typescript
import { UseInterceptors } from '@nestjs/common';
import { TransformInterceptor } from 'src/core/interceptors';

@Controller('products')
@UseInterceptors(TransformInterceptor)
export class ProductController {
  // All methods automatically wrapped
}
```

### 4. **Method-Level Interceptor** (Apply to specific methods)
```typescript
@Get('featured')
@UseInterceptors(TransformInterceptor)
async getFeatured() {
  return this.productService.getFeaturedProducts();
}
```

## 📊 Comparison: With vs Without TransformInterceptor

### ❌ WITHOUT TransformInterceptor (Manual):
```typescript
@Get('featured')
async getFeatured() {
  const products = await this.productService.getFeaturedProducts();
  return new SuccessResponseDto(products, 'Featured products retrieved');
}

@Post()
async create(@Body() dto: CreateProductDto) {
  const product = await this.productService.create(dto);
  return new CreatedResponseDto(product, 'Product created successfully');
}

@Get('search')
async search(@Query('q') query: string) {
  const results = await this.productService.search(query);
  return new SuccessResponseDto(results, `Found ${results.length} results`);
}
```

### ✅ WITH TransformInterceptor (Automatic):
```typescript
@Get('featured')
async getFeatured() {
  // Just return raw data - interceptor wraps it automatically!
  return this.productService.getFeaturedProducts();
  // Becomes: { success: true, statusCode: 200, message: 'Success', data: [...] }
}

@Post()
async create(@Body() dto: CreateProductDto) {
  // Return with custom message (optional)
  const product = await this.productService.create(dto);
  return { data: product, message: 'Product created successfully' };
  // Interceptor wraps it!
}

@Get('search')
async search(@Query('q') query: string) {
  // Return raw data
  return this.productService.search(query);
  // Automatically wrapped!
}
```

## 🔄 How TransformInterceptor Works

```typescript
// Before (what you return):
return { id: '123', name: 'Product' };

// After (what client receives):
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { "id": "123", "name": "Product" },
  "timestamp": "2024-11-02T10:30:00.000Z",
  "path": "/api/products"
}
```

## 🎨 Customizing Messages with TransformInterceptor

You can still provide custom messages:

```typescript
@Get('featured')
async getFeatured() {
  const products = await this.productService.getFeaturedProducts();
  return {
    data: products,
    message: `Found ${products.length} featured products`
  };
}
```

The interceptor will use your custom message:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Found 10 featured products",
  "data": [...]
}
```

## 🚫 When NOT to Use TransformInterceptor

### 1. **When you need ResponsePayloadDto  instances**
If you're using `BaseController`, it already returns proper DTO instances with type safety.

```typescript
// BaseController methods already return proper DTOs
@Controller('products')
export class ProductController extends BaseController<Product> {
  // create() → CreatedResponseDto (typed)
  // findAll() → PaginatedResponseDto (typed)
  // findOne() → SuccessResponseDto (typed)
}
```

### 2. **When you need different response types per method**
```typescript
// Some methods need PaginatedResponseDto
@Get()
async findAll() {
  return new PaginatedResponseDto(...);
}

// Some need CreatedResponseDto
@Post()
async create() {
  return new CreatedResponseDto(...);
}
```

### 3. **When you need full control over response structure**
```typescript
@Get('custom')
async custom() {
  // Custom response structure
  return {
    custom: true,
    specialField: 'value',
    anotherField: 123
  };
}
```

## ✅ Best Practices

### 1. **Use TransformInterceptor for simple custom endpoints**
```typescript
// Simple endpoints that don't extend BaseController
@Get('stats')
async getStats() {
  return this.service.getStats(); // Auto-wrapped!
}
```

### 2. **Use Response DTOs for complex responses**
```typescript
// Complex responses with pagination
@Get()
async findAll(@Query() pagination: PaginationDto) {
  const { data, total } = await this.service.findAll(pagination);
  return new PaginatedResponseDto(data, pagination.page, pagination.limit, total);
}
```

### 3. **Mix both approaches**
```typescript
@Controller('products')
@UseInterceptors(TransformInterceptor) // Auto-wrap simple responses
export class ProductController extends BaseController<Product> {
  
  // BaseController methods use DTOs (not affected by interceptor)
  // create() → CreatedResponseDto
  // findAll() → PaginatedResponseDto
  
  // Custom simple endpoints use interceptor
  @Get('featured')
  async getFeatured() {
    return this.service.getFeaturedProducts(); // Auto-wrapped!
  }
  
  @Get('stats')
  async getStats() {
    return this.service.getStats(); // Auto-wrapped!
  }
}
```

## 🔧 Implementation in Product Module

```typescript
// product.module.ts
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from 'src/core/interceptors';

@Module({
  controllers: [ProductController],
  providers: [
    ProductService,
    ProductRepository,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor, // ✅ Applied to all ProductController methods
    },
  ],
})
export class ProductModule {}
```

Now in ProductController:
```typescript
@Controller('products')
export class ProductController extends BaseController<Product> {
  
  // ✅ BaseController methods still return proper DTOs
  // create() → CreatedResponseDto
  // findAll() → PaginatedResponseDto
  
  // ✅ Custom endpoints auto-wrapped by interceptor
  @Get('featured')
  async getFeatured() {
    return this.productService.getFeaturedProducts(); // Simple!
  }
  
  @Get('search')
  async search(@Query('q') query: string) {
    return this.productService.search(query); // Simple!
  }
}
```

## 📝 Summary

| Approach | Use When | Pros | Cons |
|----------|----------|------|------|
| **TransformInterceptor** | Simple custom endpoints | Less boilerplate, automatic wrapping | Less type safety, less control |
| **Response DTOs** | Complex responses, BaseController | Full type safety, full control | More verbose |
| **Mixed** | Both simple and complex | Best of both worlds | Need to understand when to use which |

## 🎯 Recommendation for Your Project

**Use TransformInterceptor at module level** for modules with many simple custom endpoints:
- ✅ Product Module (has many custom endpoints like featured, search, etc.)
- ✅ Category Module (simple CRUD)
- ❌ User Module (might have complex authentication logic)

**Keep Response DTOs** for:
- ✅ BaseController methods (already implemented)
- ✅ Complex responses requiring pagination metadata
- ✅ Endpoints needing specific HTTP status codes (201, 204, etc.)
