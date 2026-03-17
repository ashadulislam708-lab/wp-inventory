# Response Layout DTOs - Usage Guide

## Overview
Standard response structure for all API endpoints to ensure consistency.

## Available Response DTOs

### 1. **ResponsePayloadDto ** (Base)
Generic response wrapper for all API responses.

```typescript
{
  success: boolean,
  statusCode: number,
  message: string,
  data?: T,
  error?: any,
  timestamp?: string,
  path?: string
}
```

### 2. **SuccessResponseDto**
For successful operations (200 OK).

```typescript
import { SuccessResponseDto } from 'src/shared/dto';

// Usage
return new SuccessResponseDto(data, 'Operation successful', 200);
```

### 3. **CreatedResponseDto**
For created resources (201 Created).

```typescript
import { CreatedResponseDto } from 'src/shared/dto';

// Usage
return new CreatedResponseDto(newProduct, 'Product created successfully');
```

### 4. **UpdatedResponseDto**
For updated resources (200 OK).

```typescript
import { UpdatedResponseDto } from 'src/shared/dto';

// Usage
return new UpdatedResponseDto(updatedProduct, 'Product updated successfully');
```

### 5. **DeletedResponseDto**
For deleted resources (200 OK).

```typescript
import { DeletedResponseDto } from 'src/shared/dto';

// Usage
return new DeletedResponseDto('Product deleted successfully');
```

### 6. **PaginatedResponseDto**
For paginated list endpoints.

```typescript
import { PaginatedResponseDto } from 'src/shared/dto';

// Usage
return new PaginatedResponseDto(
  products,      // data array
  page,          // current page
  limit,         // items per page
  total,         // total items
  'Products retrieved successfully'
);
```

**Response Structure:**
```typescript
{
  success: true,
  statusCode: 200,
  message: 'Products retrieved successfully',
  data: [...],
  meta: {
    page: 1,
    limit: 10,
    total: 100,
    totalPages: 10,
    hasNextPage: true,
    hasPreviousPage: false
  },
  timestamp: '2024-11-02T10:30:00.000Z',
  path: '/api/products'
}
```

### 7. **ErrorResponseDto**
For error responses (handled by exception filters).

```typescript
import { ErrorResponseDto } from 'src/shared/dto';

// Usage (typically in exception filters)
return new ErrorResponseDto(
  'Resource not found',
  404,
  { details: 'Product with ID xyz not found' },
  '/api/products/xyz'
);
```

## Controller Examples

### Basic CRUD Operations

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  SuccessResponseDto,
  CreatedResponseDto,
  UpdatedResponseDto,
  DeletedResponseDto,
  PaginatedResponseDto,
  PaginationDto,
} from 'src/shared/dto';

@Controller('products')
export class ProductController {
  
  // Create - 201 Created
  @Post()
  async create(@Body() dto: CreateProductDto) {
    const product = await this.service.create(dto);
    return new CreatedResponseDto(product, 'Product created successfully');
  }

  // Get All with Pagination
  @Get()
  async findAll(@Query() pagination: PaginationDto) {
    const { data, total } = await this.service.findAll(pagination);
    return new PaginatedResponseDto(
      data,
      pagination.page,
      pagination.limit,
      total,
      'Products retrieved successfully'
    );
  }

  // Get One
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const product = await this.service.findById(id);
    return new SuccessResponseDto(product, 'Product retrieved successfully');
  }

  // Update
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    const product = await this.service.update(id, dto);
    return new UpdatedResponseDto(product, 'Product updated successfully');
  }

  // Delete
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return new DeletedResponseDto('Product deleted successfully');
  }
}
```

### Custom Endpoints

```typescript
// Search
@Get('search')
async search(@Query('q') query: string) {
  const results = await this.service.search(query);
  return new SuccessResponseDto(results, `Found ${results.length} products`);
}

// Count
@Get('count')
async count() {
  const count = await this.service.count();
  return new SuccessResponseDto({ count }, 'Count retrieved successfully');
}

// Bulk Operations
@Post('bulk')
async bulkCreate(@Body() dtos: CreateProductDto[]) {
  const products = await this.service.bulkCreate(dtos);
  return new CreatedResponseDto(
    products,
    `${products.length} products created successfully`
  );
}
```

## Automatic Response Wrapping

The `TransformInterceptor` automatically wraps responses that aren't already wrapped:

```typescript
// This:
@Get()
async findAll() {
  return await this.service.findAll();
}

// Automatically becomes:
{
  success: true,
  statusCode: 200,
  message: 'Success',
  data: [...],
  timestamp: '2024-11-02T10:30:00.000Z',
  path: '/api/products'
}
```

## Error Responses

Handled automatically by `HttpExceptionFilter` and `AllExceptionsFilter`:

```typescript
// When throwing:
throw new NotFoundException('Product not found');

// Response:
{
  success: false,
  statusCode: 404,
  message: 'Product not found',
  error: {
    statusCode: 404,
    error: 'Not Found',
    method: 'GET'
  },
  timestamp: '2024-11-02T10:30:00.000Z',
  path: '/api/products/xyz'
}
```

## Swagger Documentation

All response DTOs include Swagger decorators:

```typescript
@Get()
@ApiOperation({ summary: 'Get all products' })
@ApiResponse({
  status: 200,
  description: 'Products retrieved successfully',
  type: PaginatedResponseDto,
})
async findAll(@Query() pagination: PaginationDto) {
  // ...
}
```

## Best Practices

1. **Always use response DTOs** for consistency
2. **Provide meaningful messages** to help API consumers
3. **Use appropriate status codes** (200, 201, 204, etc.)
4. **Include metadata** in paginated responses
5. **Let interceptors handle** simple responses
6. **Manually wrap** when you need custom messages or status codes

## Migration Guide

### Old Way:
```typescript
@Get()
async findAll() {
  return this.service.findAll();
}
```

### New Way (Explicit):
```typescript
@Get()
async findAll(@Query() pagination: PaginationDto) {
  const { data, total } = await this.service.findAll(pagination);
  return new PaginatedResponseDto(data, pagination.page, pagination.limit, total);
}
```

### New Way (Automatic):
```typescript
@Get()
async findAll() {
  return this.service.findAll(); // Interceptor wraps automatically
}
```

## Response Examples

### Success Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Product retrieved successfully",
  "data": {
    "id": "123",
    "name": "Product Name",
    "price": 99.99
  },
  "timestamp": "2024-11-02T10:30:00.000Z",
  "path": "/api/products/123"
}
```

### Paginated Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Products retrieved successfully",
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "timestamp": "2024-11-02T10:30:00.000Z",
  "path": "/api/products"
}
```

### Error Response:
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Product not found",
  "error": {
    "statusCode": 404,
    "error": "Not Found",
    "method": "GET"
  },
  "timestamp": "2024-11-02T10:30:00.000Z",
  "path": "/api/products/invalid-id"
}
```
