# Response Layout System - Quick Reference

## ✅ What's Been Created

### 1. **Response DTOs** (`src/shared/dto/response.dto.ts`)
- **ResponsePayloadDto ** - Base response wrapper
- **SuccessResponseDto** - 200 OK responses
- **CreatedResponseDto** - 201 Created responses
- **UpdatedResponseDto** - 200 OK for updates
- **DeletedResponseDto** - 200 OK for deletions
- **PaginatedResponseDto** - Paginated list responses
- **PaginationMetaDto** - Pagination metadata
- **ErrorResponseDto** - Error responses
- **NoContentResponseDto** - 204 No Content responses

### 2. **Updated Files**
- ✅ `src/core/base/base.controller.ts` - All CRUD methods return response DTOs
- ✅ `src/core/filters/http-exception.filter.ts` - Uses ErrorResponseDto
- ✅ `src/core/interceptors/transform.interceptor.ts` - Auto-wraps responses
- ✅ `src/shared/dto/index.ts` - Exports all response DTOs

### 3. **Documentation**
- ✅ `RESPONSE-LAYOUT-GUIDE.md` - Complete usage guide
- ✅ `src/modules/examples/example-response-usage.controller.ts` - Example controller

## 📦 Standard Response Structure

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2024-11-02T10:30:00.000Z",
  "path": "/api/endpoint"
}
```

### Paginated Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Data retrieved successfully",
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "timestamp": "2024-11-02T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Resource not found",
  "error": {
    "statusCode": 404,
    "error": "Not Found",
    "method": "GET"
  },
  "timestamp": "2024-11-02T10:30:00.000Z",
  "path": "/api/endpoint"
}
```

## 🚀 Usage Examples

### Using BaseController (Automatic)
```typescript
@Controller('products')
export class ProductController extends BaseController<Product, CreateDto, UpdateDto> {
  constructor(productService: ProductService) {
    super(productService);
  }
  // All CRUD methods automatically return response DTOs!
  // create() → CreatedResponseDto
  // findAll() → PaginatedResponseDto
  // findOne() → SuccessResponseDto
  // update() → UpdatedResponseDto
  // remove() → DeletedResponseDto
}
```

### Custom Endpoints (Manual)
```typescript
@Get('search')
async search(@Query('q') query: string) {
  const results = await this.service.search(query);
  return new SuccessResponseDto(results, `Found ${results.length} results`);
}

@Post('bulk')
async bulkCreate(@Body() dtos: CreateDto[]) {
  const created = await this.service.bulkCreate(dtos);
  return new CreatedResponseDto(created, `${created.length} items created`);
}

@Get()
async findAll(@Query() pagination: PaginationDto) {
  const { data, total } = await this.service.findAllPaginated(pagination);
  return new PaginatedResponseDto(
    data,
    pagination.page,
    pagination.limit,
    total,
    'Data retrieved successfully'
  );
}
```

## 🎯 Key Benefits

1. **Consistency** - All APIs follow the same response structure
2. **Type Safety** - Full TypeScript support with generics
3. **Swagger Integration** - Automatic API documentation
4. **Error Handling** - Unified error response format
5. **Pagination** - Built-in pagination metadata
6. **Flexibility** - Use automatic (BaseController) or manual approach

## 📝 Import Path
```typescript
import {
  SuccessResponseDto,
  CreatedResponseDto,
  UpdatedResponseDto,
  DeletedResponseDto,
  PaginatedResponseDto,
  ErrorResponseDto,
  PaginationDto,
} from 'src/shared/dto';
```

## ⚠️ Important Notes

1. **BaseController already uses these** - No changes needed for controllers extending BaseController
2. **TransformInterceptor auto-wraps** - Simple responses are automatically wrapped
3. **Exception filters handle errors** - Errors automatically use ErrorResponseDto
4. **Custom endpoints** - Use response DTOs manually for custom endpoints

## 🔄 Migration Checklist

- [x] Create response DTOs
- [x] Update BaseController to use response DTOs
- [x] Update exception filters
- [x] Update transform interceptor
- [x] Export from shared/dto
- [x] Create documentation
- [x] Create example controller

## 🎉 Ready to Use!

All existing controllers extending `BaseController` now automatically return standardized responses!
