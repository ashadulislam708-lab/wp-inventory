# Exception Handling Guide

## Overview

This guide explains the **clean, reusable exception handling architecture** implemented in this NestJS application. The design philosophy is simple:

- **Services throw simple exceptions** with translated messages
- **Exception filter automatically adds structure** (data field, error details array)
- **All exception types supported** without hardcoded logic

---

## Architecture

### 1. Service Layer (Simple & Clean)

Services throw standard NestJS exceptions with translated messages:

```typescript
// ✅ CORRECT: Simple exception with i18n message
throw new ConflictException(
  this.i18nHelper.t('translation.users.errors.email_exists', { 
    email: createUserDto.email 
  })
);

// ✅ CORRECT: Other exception types work the same way
throw new NotFoundException(
  this.i18nHelper.t('translation.users.errors.not_found', { 
    id: userId 
  })
);

throw new BadRequestException(
  this.i18nHelper.t('translation.validation.invalid_data')
);

throw new UnauthorizedException(
  this.i18nHelper.t('translation.auth.errors.invalid_credentials')
);
```

**❌ WRONG: Don't use HttpException with custom structure**
```typescript
// Don't do this - it's not reusable and makes services messy
throw new HttpException({
  success: false,
  message: this.i18nHelper.t(...),
  data: null,
  error: [{ field: 'email', reason: '...', code: 'CONFLICT' }]
}, HttpStatus.CONFLICT);
```

---

### 2. Exception Filter (Automatic Structure)

The `HttpExceptionFilter` in `src/core/filters/http-exception.filter.ts` automatically:

1. **Catches all HTTP exceptions**
2. **Generates structured error details** based on exception type
3. **Wraps response** in standardized `ErrorResponseDto` format
4. **Logs errors** with appropriate detail level

#### How It Works

```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    // Extract message from exception
    const message = exception.getMessage(); // Already translated by service
    
    // Automatically generate structured error details based on exception TYPE
    const errorDetails = this.generateErrorDetailsFromException(exception, status, request);
    
    // Wrap in standardized format
    const errorResponse = new ErrorResponseDto(message, status, errorDetails, request.url);
    
    response.status(status).json(errorResponse);
  }
}
```

---

## Exception Type Mapping

The filter **automatically** maps exception types to structured error details:

### ConflictException (409)

**Service Code:**
```typescript
throw new ConflictException(
  this.i18nHelper.t('translation.users.errors.email_exists', { 
    email: 'user@example.com' 
  })
);
```

**Automatic Response:**
```json
{
  "success": false,
  "statusCode": 409,
  "message": "A user with the email user@example.com already exists.",
  "data": null,
  "error": [{
    "field": "email",
    "reason": "Resource with this identifier already exists",
    "code": "CONFLICT"
  }],
  "timestamp": "2025-11-06T18:08:59.180Z",
  "path": "/users"
}
```

### NotFoundException (404)

**Service Code:**
```typescript
throw new NotFoundException(
  this.i18nHelper.t('translation.users.errors.not_found', { 
    id: userId 
  })
);
```

**Automatic Response:**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "User with ID 123 not found.",
  "data": null,
  "error": [{
    "field": "id",
    "reason": "Resource not found",
    "code": "NOT_FOUND"
  }],
  "timestamp": "2025-11-06T18:08:59.180Z",
  "path": "/users/123"
}
```

### UnauthorizedException (401)

**Service Code:**
```typescript
throw new UnauthorizedException(
  this.i18nHelper.t('translation.auth.errors.invalid_credentials')
);
```

**Automatic Response:**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid email or password.",
  "data": null,
  "error": [{
    "field": "credentials",
    "reason": "Invalid credentials or missing authentication",
    "code": "UNAUTHORIZED"
  }],
  "timestamp": "2025-11-06T18:08:59.180Z",
  "path": "/auth/login"
}
```

### ForbiddenException (403)

**Service Code:**
```typescript
throw new ForbiddenException(
  this.i18nHelper.t('translation.auth.errors.forbidden')
);
```

**Automatic Response:**
```json
{
  "success": false,
  "statusCode": 403,
  "message": "You don't have permission to access this resource.",
  "data": null,
  "error": [{
    "field": "permissions",
    "reason": "Insufficient permissions to access this resource",
    "code": "FORBIDDEN"
  }],
  "timestamp": "2025-11-06T18:08:59.180Z",
  "path": "/admin/users"
}
```

### BadRequestException (400)

**Service Code:**
```typescript
throw new BadRequestException(
  this.i18nHelper.t('translation.validation.invalid_data')
);
```

**Automatic Response:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "The provided data is invalid.",
  "data": null,
  "error": [{
    "field": "data",
    "reason": "Invalid request data",
    "code": "BAD_REQUEST"
  }],
  "timestamp": "2025-11-06T18:08:59.180Z",
  "path": "/users"
}
```

---

## Smart Field Detection

The filter automatically detects the relevant field from:

1. **Request body** (email, username, id)
2. **URL parameters** (last segment)
3. **Fallback values** based on exception type

```typescript
private generateErrorDetailsFromException(exception, status, request) {
  const extractField = (): string | undefined => {
    // Try request body first
    if (request.body?.email) return 'email';
    if (request.body?.username) return 'username';
    if (request.body?.id) return 'id';
    
    // Try URL params
    const pathSegments = request.url.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];
    if (lastSegment && lastSegment !== '' && !lastSegment.includes('?')) {
      return 'id';
    }
    
    return undefined;
  };
  
  // Use detected field in error structure
  if (exception instanceof ConflictException) {
    return [{
      field: extractField() || 'resource',
      reason: 'Resource with this identifier already exists',
      code: 'CONFLICT'
    }];
  }
  // ... other exception types
}
```

---

## Validation Errors

The filter also handles **class-validator** validation errors automatically:

**Service Code:**
```typescript
// No need to throw manually - handled by ValidationPipe
// Just use DTOs with decorators:
export class CreateUserDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;
}
```

**Automatic Response:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed: email must be an email; password must be longer than 8 characters",
  "data": null,
  "error": [
    {
      "field": "email",
      "reason": "email must be an email",
      "constraints": {
        "isEmail": "email must be an email"
      }
    },
    {
      "field": "password",
      "reason": "password must be longer than 8 characters",
      "constraints": {
        "minLength": "password must be longer than 8 characters"
      }
    }
  ],
  "timestamp": "2025-11-06T18:08:59.180Z",
  "path": "/users"
}
```

---

## i18n Integration

### Translation Files

Use `{{variable}}` syntax for variable interpolation:

**src/i18n/en/translation.json:**
```json
{
  "users": {
    "errors": {
      "email_exists": "A user with the email {{email}} already exists.",
      "not_found": "User with ID {{id}} not found."
    },
    "success": {
      "created": "User {{email}} created successfully."
    }
  }
}
```

**src/i18n/ko/translation.json:**
```json
{
  "users": {
    "errors": {
      "email_exists": "이메일 {{email}}을(를) 가진 사용자가 이미 존재합니다.",
      "not_found": "ID {{id}}의 사용자를 찾을 수 없습니다."
    },
    "success": {
      "created": "사용자 {{email}}이(가) 성공적으로 생성되었습니다."
    }
  }
}
```

### Using i18nHelper in Services

```typescript
@Injectable()
export class UserService {
  constructor(private readonly i18nHelper: I18nHelper) {}

  async createUser(dto: CreateUserDto): Promise<ResponsePayloadDto<User>> {
    // Check for existing user
    const exists = await this.userRepository.findByEmail(dto.email);
    if (exists) {
      // Simple exception with translated message
      throw new ConflictException(
        this.i18nHelper.t('translation.users.errors.email_exists', { 
          email: dto.email 
        })
      );
    }

    // Create user...
    return new ResponsePayloadDto({
      success: true,
      statusCode: 201,
      message: this.i18nHelper.t('translation.users.success.created', { 
        email: dto.email 
      }),
      data: user,
    });
  }
}
```

**Important:** The i18nHelper was fixed to use `{ lang, ...args }` instead of `{ lang, args }` to properly pass variables to nestjs-i18n.

---

## Benefits of This Architecture

### 1. **Clean Service Code**
- Services don't need to know about response structure
- Just throw appropriate exception type with translated message
- No complex error object construction

### 2. **Reusable & DRY**
- Exception-to-structure mapping defined once in filter
- Works for ALL exception types automatically
- No code duplication across services

### 3. **Consistent API Responses**
- All errors follow the same structure
- Frontend can rely on predictable format
- Easy to document in Swagger

### 4. **Easy to Extend**
- Add new exception type? Just add mapping in filter
- Want custom field detection? Modify `extractField()` method
- All existing code continues to work

### 5. **Type-Safe**
- Uses NestJS built-in exception classes
- TypeScript ensures correct exception types
- ErrorResponseDto and ErrorDetailDto are strongly typed

---

## Testing Examples

### Test Case 1: Duplicate Email

**Request:**
```bash
POST /users
Content-Type: application/json

{
  "email": "existing@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": false,
  "statusCode": 409,
  "message": "A user with the email existing@example.com already exists.",
  "data": null,
  "error": [{
    "field": "email",
    "reason": "Resource with this identifier already exists",
    "code": "CONFLICT"
  }],
  "timestamp": "2025-11-06T18:08:59.180Z",
  "path": "/users"
}
```

### Test Case 2: User Not Found

**Request:**
```bash
GET /users/99999
```

**Response:**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "User with ID 99999 not found.",
  "data": null,
  "error": [{
    "field": "id",
    "reason": "Resource not found",
    "code": "NOT_FOUND"
  }],
  "timestamp": "2025-11-06T18:08:59.180Z",
  "path": "/users/99999"
}
```

### Test Case 3: Validation Error

**Request:**
```bash
POST /users
Content-Type: application/json

{
  "email": "invalid-email",
  "password": "123"
}
```

**Response:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed: email must be an email; password must be longer than 8 characters",
  "data": null,
  "error": [
    {
      "field": "email",
      "reason": "email must be an email",
      "constraints": {
        "isEmail": "email must be an email"
      }
    },
    {
      "field": "password",
      "reason": "password must be longer than 8 characters",
      "constraints": {
        "minLength": "password must be longer than 8 characters"
      }
    }
  ],
  "timestamp": "2025-11-06T18:08:59.180Z",
  "path": "/users"
}
```

---

## Troubleshooting

### Issue: Variables Not Interpolated

**Problem:** `{{email}}` showing as `{email}` in response

**Solution:**
1. Ensure translation files use `{{variable}}` syntax (double curly braces)
2. Check i18nHelper uses `{ lang, ...args }` not `{ lang, args }`
3. Restart the server after changing translation files

### Issue: Wrong Language Returned

**Problem:** Getting English when expecting Korean

**Solution:**
1. Check `app.module.ts` has `fallbackLanguage: LanguageEnum.KOREAN`
2. Verify i18nHelper fallback: `I18nContext.current()?.lang || LanguageEnum.KOREAN`
3. Test with `?lang=ko` query parameter

### Issue: Error Structure Missing Fields

**Problem:** Response doesn't have `data` or `error` field

**Solution:**
1. Verify filter is registered globally in `main.ts`
2. Check exception is instance of `HttpException`
3. Ensure `ErrorResponseDto` is properly constructed

---

## Related Files

- **Exception Filter:** `src/core/filters/http-exception.filter.ts`
- **i18n Helper:** `src/core/utils/i18n.helper.ts`
- **DTOs:** `src/shared/dtos/error-response.dto.ts`, `src/shared/dtos/error-detail.dto.ts`
- **Translation Files:** `src/i18n/en/translation.json`, `src/i18n/ko/translation.json`
- **Example Service:** `src/modules/users/user.service.ts`

---

## Summary

This exception handling architecture provides:

✅ **Simple service code** - just throw exceptions  
✅ **Automatic structure** - filter adds error details  
✅ **Reusable pattern** - works for all exception types  
✅ **Type-safe** - TypeScript ensures correctness  
✅ **i18n support** - multi-language error messages  
✅ **Consistent API** - predictable response format  
✅ **Easy to extend** - add new exception types easily

**Remember:** Keep services simple, let the filter handle structure!
