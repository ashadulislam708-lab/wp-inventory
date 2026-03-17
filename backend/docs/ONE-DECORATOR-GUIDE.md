# 🎯 ONE DECORATOR TO RULE THEM ALL: ApiSwagger

## ✅ What Changed

**You now only need ONE decorator: `@ApiSwagger`**

All these old decorators are **OPTIONAL** (kept for backward compatibility but NOT needed):
- ❌ `@ApiCreate`
- ❌ `@ApiGetAll`
- ❌ `@ApiGetOne`
- ❌ `@ApiUpdate`
- ❌ `@ApiDelete`
- ❌ `@ApiSearch`
- ❌ `@ApiCount`
- ❌ `@ApiResponseData`
- ❌ `@ApiResponseDto`

**Use only:** ✅ `@ApiSwagger` for EVERYTHING

---

## 🚀 New Object-Based Syntax (RECOMMENDED)

### Create Endpoint
```typescript
@Post()
@HttpCode(HttpStatus.CREATED)
@ApiSwagger({
  resourceName: 'User',
  operation: 'create',
  requestDto: CreateUserDto,
  responseDto: UserResponseDto,
  successStatus: 201,
})
async create(@Body() dto: CreateUserDto) {
  return this.service.create(dto);
}
```

**What it generates:**
- ✅ Summary: "Create a new user"
- ✅ Request body: CreateUserDto schema
- ✅ Success response (201): ResponsePayloadDto<UserResponseDto>
- ✅ Auto-errors: 400 (validation), 409 (already exists), 401 (if auth required)

---

### Get All (with Pagination)
```typescript
@Get()
@ApiSwagger({
  resourceName: 'Users',
  operation: 'getAll',
  responseDto: UserResponseDto,
  isArray: true,
  withPagination: true,
})
async findAll(@Query() query: PaginationDto) {
  return this.service.findAll(query);
}
```

**What it generates:**
- ✅ Summary: "Get all users"
- ✅ Query params: page, limit, search, sortBy, sortOrder
- ✅ Success response (200): ResponsePayloadDto<UserResponseDto[]>
- ✅ Auto-errors: 401 (if auth required)

---

### Get One by ID
```typescript
@Get(':id')
@ApiSwagger({
  resourceName: 'User',
  operation: 'getOne',
  responseDto: UserResponseDto,
})
async findOne(@Param('id') id: string) {
  return this.service.findOne(id);
}
```

**What it generates:**
- ✅ Summary: "Get user by id"
- ✅ Param: id (UUID)
- ✅ Success response (200): ResponsePayloadDto<UserResponseDto>
- ✅ Auto-errors: 404 (not found), 401 (if auth required)

---

### Update
```typescript
@Patch(':id')
@ApiSwagger({
  resourceName: 'User',
  operation: 'update',
  requestDto: UpdateUserDto,
  responseDto: UserResponseDto,
})
async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
  return this.service.update(id, dto);
}
```

**What it generates:**
- ✅ Summary: "Update user"
- ✅ Param: id (UUID)
- ✅ Request body: UpdateUserDto
- ✅ Success response (200): ResponsePayloadDto<UserResponseDto>
- ✅ Auto-errors: 400 (validation), 404 (not found), 409 (conflict), 401 (if auth)

---

### Delete
```typescript
@Delete(':id')
@HttpCode(HttpStatus.NO_CONTENT)
@ApiSwagger({
  resourceName: 'User',
  operation: 'delete',
  successStatus: 204,
})
async remove(@Param('id') id: string) {
  return this.service.remove(id);
}
```

**What it generates:**
- ✅ Summary: "Delete user"
- ✅ Param: id (UUID)
- ✅ Success response (204): No content
- ✅ Auto-errors: 404 (not found), 401 (if auth)

---

### Custom / Public Endpoint (Login Example)
```typescript
@Post('login')
@ApiSwagger({
  resourceName: 'User Login',
  operation: 'custom',
  summary: 'Authenticate user and return JWT tokens',
  requestDto: LoginDto,
  responseDto: LoginResponseDto,
  requiresAuth: false,
  errors: [
    { status: 400, description: 'Invalid credentials' },
    { status: 429, description: 'Too many login attempts' },
  ],
})
async login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}
```

**What it generates:**
- ✅ Summary: Custom summary you provide
- ✅ Request body: LoginDto
- ✅ Success response (200): ResponsePayloadDto<LoginResponseDto>
- ✅ Custom errors: 400, 429
- ✅ NO 401 error (requiresAuth: false)

---

## 📦 All Configuration Options

```typescript
interface ApiSwaggerOptions {
  /** Resource name (e.g., 'User', 'Product') */
  resourceName: string;
  
  /** Operation type for auto-generating summary and common errors */
  operation?: 'create' | 'getAll' | 'getOne' | 'update' | 'delete' | 'search' | 'count' | 'custom';
  
  /** Request body DTO */
  requestDto?: Type<any>;
  
  /** Response data DTO (used in ResponsePayloadDto.data) */
  responseDto?: Type<any>;
  
  /** HTTP success status code (default: 200) */
  successStatus?: number;
  
  /** If true, response data is an array */
  isArray?: boolean;
  
  /** Whether endpoint requires bearer auth (default: true) */
  requiresAuth?: boolean;
  
  /** Array of custom error responses to document */
  errors?: Array<{ status: number; description?: string }>;
  
  /** Custom operation summary (overrides auto-generated) */
  summary?: string;
  
  /** ID parameter name for getOne/update/delete (default: 'id') */
  paramName?: string;
  
  /** Add pagination query params for getAll (default: false) */
  withPagination?: boolean;
}
```

---

## 🔄 Auto-Generated Features by Operation

### `operation: 'create'`
- Summary: "Create a new {resource}"
- Auto-errors: 400 (validation), 409 (already exists)

### `operation: 'getAll'`
- Summary: "Get all {resource}"
- Optional pagination query params (if `withPagination: true`)

### `operation: 'getOne'`
- Summary: "Get {resource} by {paramName}"
- Param: {paramName} (UUID)
- Auto-errors: 404 (not found)

### `operation: 'update'`
- Summary: "Update {resource}"
- Param: {paramName} (UUID)
- Auto-errors: 400 (validation), 404 (not found), 409 (conflict)

### `operation: 'delete'`
- Summary: "Delete {resource}"
- Param: {paramName} (UUID)
- Auto-errors: 404 (not found)

### `operation: 'search'`
- Summary: "Search {resource}"

### `operation: 'count'`
- Summary: "Count {resource}"

### `operation: 'custom'`
- No auto-generation, you control everything

---

## 🔥 Benefits

### Before (Multiple Decorators)
```typescript
@Post()
@HttpCode(HttpStatus.CREATED)
@ApiCreate('User', CreateUserDto)
@ApiResponseData(UserDto, 201)
@ApiResponse({ status: 400, description: 'Validation failed' })
@ApiResponse({ status: 409, description: 'User already exists' })
@ApiBearerAuth()
async create(@Body() dto: CreateUserDto) { ... }
```

### After (ONE Decorator)
```typescript
@Post()
@HttpCode(HttpStatus.CREATED)
@ApiSwagger({
  resourceName: 'User',
  operation: 'create',
  requestDto: CreateUserDto,
  responseDto: UserDto,
  successStatus: 201,
})
async create(@Body() dto: CreateUserDto) { ... }
```

**Result:**
- ✅ 80% less code
- ✅ Auto-generates common errors
- ✅ Type-safe configuration object
- ✅ Self-documenting with IntelliSense
- ✅ Consistent across entire API

---

## 🔀 Legacy Parameter Syntax (Still Works)

If you prefer, the old parameter-based syntax still works:

```typescript
@ApiSwagger('User', CreateUserDto, UserDto, 201, false, true, [
  { status: 400, description: 'Validation failed' },
])
```

But the **object syntax is STRONGLY RECOMMENDED** for:
- Better readability
- Named parameters (no need to remember order)
- IntelliSense support
- Easier to add/remove options

---

## 🎯 Migration Guide

### Step 1: Replace Old Decorators
Search and replace across your controllers:

#### Create
```typescript
// OLD
@ApiCreate('User', CreateUserDto, UserDto)

// NEW
@ApiSwagger({
  resourceName: 'User',
  operation: 'create',
  requestDto: CreateUserDto,
  responseDto: UserDto,
  successStatus: 201,
})
```

#### GetAll
```typescript
// OLD
@ApiGetAll('Users', UserDto, true)

// NEW
@ApiSwagger({
  resourceName: 'Users',
  operation: 'getAll',
  responseDto: UserDto,
  isArray: true,
  withPagination: true,
})
```

#### Update
```typescript
// OLD
@ApiUpdate('User', UpdateUserDto, UserDto)

// NEW
@ApiSwagger({
  resourceName: 'User',
  operation: 'update',
  requestDto: UpdateUserDto,
  responseDto: UserDto,
})
```

### Step 2: Update Imports
```typescript
// OLD
import { 
  ApiCreate, 
  ApiGetAll, 
  ApiUpdate, 
  ApiResponseData 
} from 'src/core/decorators';

// NEW (ONE import!)
import { ApiSwagger } from 'src/core/decorators';
```

### Step 3: Remove Redundant Decorators
The old decorators (`ApiCreate`, `ApiGetAll`, etc.) are kept for backward compatibility but are no longer needed. You can:
1. Keep them in the codebase (they still work)
2. Or gradually migrate and eventually delete `api-docs.decorator.ts`

---

## 📊 Example: Complete CRUD Controller

```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSwagger } from 'src/core/decorators';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dtos';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiSwagger({
    resourceName: 'User',
    operation: 'create',
    requestDto: CreateUserDto,
    responseDto: UserResponseDto,
    successStatus: 201,
  })
  async create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Get()
  @ApiSwagger({
    resourceName: 'Users',
    operation: 'getAll',
    responseDto: UserResponseDto,
    isArray: true,
    withPagination: true,
  })
  async findAll(@Query() query: any) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @ApiSwagger({
    resourceName: 'User',
    operation: 'getOne',
    responseDto: UserResponseDto,
  })
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiSwagger({
    resourceName: 'User',
    operation: 'update',
    requestDto: UpdateUserDto,
    responseDto: UserResponseDto,
  })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiSwagger({
    resourceName: 'User',
    operation: 'delete',
    successStatus: 204,
  })
  async remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
```

**Only 1 import, 1 decorator per endpoint, auto-generated docs!** 🎉

---

## ✨ Summary

| Feature | Old Way | New Way |
|---------|---------|---------|
| **Decorators needed** | 5-7 per endpoint | 1 per endpoint |
| **Imports** | Multiple | Just `ApiSwagger` |
| **Error docs** | Manual `@ApiResponse` | Auto-generated |
| **Type safety** | Parameters | Object config |
| **Maintenance** | High | Low |
| **Readability** | Medium | High |

**Result: Cleaner code, less maintenance, consistent documentation!** 🚀
