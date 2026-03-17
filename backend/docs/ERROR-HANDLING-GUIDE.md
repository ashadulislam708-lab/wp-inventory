# Error Handling & Response System

## Overview

This application implements a **comprehensive error handling system** that provides clear, actionable error messages to frontend developers and end users. All errors follow a standardized format using `ErrorResponseDto` and `ErrorDetailDto` classes.

## Error Response Format

All errors follow this consistent structure:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "User-friendly error message",
  "error": [
    {
      "field": "email",
      "reason": "Invalid format",
      "constraints": {
        "isEmail": "email must be an email"
      },
      "code": "INVALID_EMAIL"
    }
  ],
  "path": "/api/auth/login",
  "timestamp": "2024-11-02T10:30:00.000Z"
}
```

### Key Fields

- **`success`**: Always `false` for errors
- **`statusCode`**: HTTP status code (400, 401, 403, 404, 409, 500, etc.)
- **`message`**: Human-readable error message (show this to users)
- **`error`**: Array of `ErrorDetailDto` objects with detailed error information
  - **`field`**: Field name (optional, for validation errors)
  - **`reason`**: Human-readable reason
  - **`constraints`**: Validation constraints object (optional)
  - **`code`**: Machine-friendly error code (optional)
- **`path`**: Request URL path
- **`timestamp`**: ISO 8601 timestamp

## Common Error Responses

### 400 - Bad Request (Validation Errors)

**Single Field Error:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "email must be an email",
  "error": [
    {
      "field": "email",
      "reason": "email must be an email",
      "constraints": {
        "isEmail": "email must be an email"
      }
    }
  ],
  "path": "/api/auth/register",
  "timestamp": "2024-11-02T10:30:00.000Z"
}
```

**Multiple Field Errors:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed: email: email must be an email; password: password must be longer than or equal to 8 characters",
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
      "reason": "password must be longer than or equal to 8 characters",
      "constraints": {
        "minLength": "password must be longer than or equal to 8 characters"
      }
    }
  ],
  "path": "/api/auth/register",
  "timestamp": "2024-11-02T10:30:00.000Z"
}
```

### 401 - Unauthorized

**Invalid Credentials:**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": [
    {
      "reason": "Invalid credentials",
      "code": "Unauthorized"
    }
  ],
  "path": "/api/auth/login",
  "timestamp": "2024-11-02T10:30:00.000Z"
}
```

**Missing Token:**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid or missing token",
  "error": [
    {
      "reason": "Invalid or missing token",
      "code": "Unauthorized"
    }
  ],
  "path": "/api/products",
  "timestamp": "2024-11-02T10:30:00.000Z"
}
```

### 403 - Forbidden

**Insufficient Permissions:**
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": [
    {
      "reason": "Insufficient permissions",
      "code": "Forbidden"
    }
  ],
  "path": "/api/admin/users",
  "timestamp": "2024-11-02T10:30:00.000Z"
}
```

### 404 - Not Found

```json
{
  "success": false,
  "statusCode": 404,
  "message": "User with ID abc-123 not found",
  "error": [
    {
      "reason": "User with ID abc-123 not found",
      "code": "NotFoundException"
    }
  ],
  "path": "/api/users/abc-123",
  "timestamp": "2024-11-02T10:30:00.000Z"
}
```

### 409 - Conflict

**Duplicate Email:**
```json
{
  "success": false,
  "statusCode": 409,
  "message": "User with this email already exists",
  "error": [
    {
      "reason": "User with this email already exists",
      "code": "ConflictException"
    }
  ],
  "path": "/api/auth/register",
  "timestamp": "2024-11-02T10:30:00.000Z"
}
```

### 500 - Internal Server Error

**Production Mode:**
```json
{
  "success": false,
  "statusCode": 500,
  "message": "An unexpected error occurred. Please try again later.",
  "error": [
    {
      "reason": "InternalServerError",
      "code": "InternalServerError"
    }
  ],
  "path": "/api/products",
  "timestamp": "2024-11-02T10:30:00.000Z"
}
```

**Development Mode (includes stack trace):**
```json
{
  "success": false,
  "statusCode": 500,
  "message": "An unexpected error occurred. Please try again later.",
  "error": [
    {
      "reason": "Database connection failed",
      "code": "InternalServerError",
      "constraints": {
        "stack": "Error: Something went wrong\n    at ...",
        "originalMessage": "Database connection failed"
      }
    }
  ],
  "path": "/api/products",
  "timestamp": "2024-11-02T10:30:00.000Z"
}
```

## Backend Implementation

### Error Response DTOs

The application uses standardized DTOs for error responses:

#### ErrorDetailDto

```typescript
export class ErrorDetailDto {
  field?: string;        // Field name (for validation errors)
  reason?: string;       // Human-readable error message
  constraints?: Record<string, string>;  // Validation constraints
  code?: string;         // Machine-friendly error code
}
```

#### ErrorResponseDto

```typescript
export class ErrorResponseDto extends ResponsePayloadDto {
  constructor(
    message: string,
    statusCode: number = 500,
    error?: ErrorDetailDto[],  // Array of error details
    path?: string,
  ) {
    super({
      success: false,
      statusCode,
      message,
      error,
      path,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Exception Filters

The application uses two global exception filters:

#### 1. HttpExceptionFilter

Handles all `HttpException` errors thrown by NestJS:

```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extract validation errors and format them
    let message: string;
    let errorDetails: ErrorDetailDto[] | undefined;

    // Handle validation errors (class-validator)
    if (Array.isArray(responseObj.message)) {
      const validationDetails = this.parseValidationArray(responseObj.message);
      message = this.formatValidationErrors(validationDetails);
      errorDetails = validationDetails;
    }

    // Create standardized error response
    const errorResponse = new ErrorResponseDto(
      message,
      status,
      errorDetails,
      request.url,
    );

    response.status(status).json(errorResponse);
  }
}
```

#### 2. AllExceptionsFilter

Catches all unhandled exceptions:

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Hide internal errors in production
    const message = status === HttpStatus.INTERNAL_SERVER_ERROR
      ? 'An unexpected error occurred. Please try again later.'
      : exception.message;

    // Include stack trace only in development
    const errorDetails: ErrorDetailDto[] = [
      {
        reason: exception.message || 'InternalServerError',
        code: exception.name || 'InternalServerError',
        constraints: process.env.NODE_ENV === 'development'
          ? { stack: exception.stack, originalMessage: exception.message }
          : undefined,
      },
    ];

    const errorResponse = new ErrorResponseDto(
      message,
      status,
      errorDetails,
      request.url,
    );

    response.status(status).json(errorResponse);
  }
}
```

### Using i18n with Error Messages

The application supports multi-language error messages using `I18nHelper`:

```typescript
import { I18nHelper } from 'src/core/utils/i18n.helper';

@Injectable()
export class AuthService {
  constructor(private readonly i18nHelper: I18nHelper) {}

  async login(email: string, password: string) {
    const user = await this.findUserByEmail(email);
    
    if (!user) {
      throw new NotFoundException(
        this.i18nHelper.t('auth.userNotFound', { args: { email } })
      );
    }

    if (!await this.comparePasswords(password, user.password)) {
      throw new UnauthorizedException(
        this.i18nHelper.t('auth.invalidCredentials')
      );
    }

    return user;
  }
}
```

**Translation Files:**

`src/i18n/en/auth.json`:
```json
{
  "auth": {
    "userNotFound": "User with email {email} not found",
    "invalidCredentials": "Invalid credentials"
  }
}
```

`src/i18n/ko/auth.json`:
```json
{
  "auth": {
    "userNotFound": "이메일 {email}의 사용자를 찾을 수 없습니다",
    "invalidCredentials": "잘못된 자격 증명"
  }
}
```

### Exception Throwing Patterns

**Use NestJS Built-in Exceptions:**

```typescript
import {
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

// 400 - Bad Request
throw new BadRequestException('Invalid input data');
throw new BadRequestException(this.i18nHelper.t('validation.invalidInput'));

// 401 - Unauthorized
throw new UnauthorizedException('Invalid credentials');
throw new UnauthorizedException(this.i18nHelper.t('auth.invalidCredentials'));

// 403 - Forbidden
throw new ForbiddenException('Insufficient permissions');
throw new ForbiddenException(this.i18nHelper.t('auth.forbidden'));

// 404 - Not Found
throw new NotFoundException('User not found');
throw new NotFoundException(this.i18nHelper.t('user.notFound', { args: { id } }));

// 409 - Conflict
throw new ConflictException('Email already exists');
throw new ConflictException(this.i18nHelper.t('user.emailExists'));

// 500 - Internal Server Error
throw new InternalServerErrorException('Database error');
throw new InternalServerErrorException(this.i18nHelper.t('errors.internal'));
```

### Validation Errors

Class-validator errors are automatically caught and formatted:

```typescript
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'email must be a valid email' })
  @IsNotEmpty({ message: 'email should not be empty' })
  email: string;

  @MinLength(8, { message: 'password must be at least 8 characters' })
  @IsNotEmpty({ message: 'password should not be empty' })
  password: string;
}
```

The filter automatically converts these to:

```json
{
  "message": "Validation failed: email: email must be a valid email; password: password must be at least 8 characters",
  "error": [
    {
      "field": "email",
      "reason": "email must be a valid email",
      "constraints": { "isEmail": "email must be a valid email" }
    },
    {
      "field": "password",
      "reason": "password must be at least 8 characters",
      "constraints": { "minLength": "password must be at least 8 characters" }
    }
  ]
}
```

## Frontend Integration

### React Example with Axios

```typescript
import axios, { AxiosError } from 'axios';

interface ErrorDetail {
  field?: string;
  reason?: string;
  constraints?: Record<string, string>;
  code?: string;
}

interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error?: ErrorDetail[];
  path: string;
  timestamp: string;
}

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorResponse>) => {
    if (error.response) {
      const { data } = error.response;
      
      // Display user-friendly message
      console.error('API Error:', data.message);
      
      // Handle specific error codes
      switch (data.statusCode) {
        case 400:
          // Validation errors - show each field error
          if (data.error && data.error.length > 0) {
            data.error.forEach(err => {
              const message = err.field 
                ? `${err.field}: ${err.reason}`
                : err.reason;
              toast.error(message);
            });
          } else {
            toast.error(data.message);
          }
          break;
          
        case 401:
          // Unauthorized - redirect to login
          toast.error(data.message || 'Please login to continue');
          window.location.href = '/login';
          break;
          
        case 403:
          // Forbidden
          toast.error(data.message || 'You don\'t have permission');
          break;
          
        case 404:
          // Not found
          toast.error(data.message);
          break;
          
        case 409:
          // Conflict
          toast.error(data.message);
          break;
          
        case 500:
          // Internal server error
          toast.error(data.message || 'Something went wrong');
          break;
          
        default:
          toast.error(data.message || 'An error occurred');
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

// Usage
async function loginUser(email: string, password: string) {
  try {
    const response = await api.post('/auth/login', { email, password });
    toast.success('Login successful!');
    return response.data;
  } catch (error) {
    // Error already handled by interceptor
    throw error;
  }
}
```

### Vue 3 Example with Composable

```typescript
// composables/useApi.ts
import { ref } from 'vue';
import axios, { AxiosError } from 'axios';

export function useApi() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const api = axios.create({
    baseURL: 'http://localhost:3000',
    withCredentials: true,
  });

  api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ErrorResponse>) => {
      if (error.response?.data) {
        const errorMessage = error.response.data.message;
        error.value = errorMessage;
        
        // Show toast notification
        useToast().error(errorMessage);
      }
      return Promise.reject(error);
    }
  );

  async function request<T>(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
    data?: any
  ): Promise<T | null> {
    loading.value = true;
    error.value = null;

    try {
      const response = await api[method](url, data);
      return response.data.data;
    } catch (err) {
      return null;
    } finally {
      loading.value = false;
    }
  }

  return {
    api,
    loading,
    error,
    request,
  };
}
```

### Angular Example with Interceptor

```typescript
// error.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

interface ErrorDetail {
  field?: string;
  reason?: string;
  constraints?: Record<string, string>;
  code?: string;
}

interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error?: ErrorDetail[];
  path: string;
  timestamp: string;
}

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private toastr: ToastrService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.error && error.error.message) {
          const errorData = error.error as ErrorResponse;
          const errorMessage = errorData.message;
          
          switch (error.status) {
            case 400:
              if (errorData.error && errorData.error.length > 0) {
                errorData.error.forEach((err: ErrorDetail) => {
                  const msg = err.field 
                    ? `${err.field}: ${err.reason}`
                    : err.reason;
                  this.toastr.error(msg || '', 'Validation Error');
                });
              } else {
                this.toastr.error(errorMessage, 'Bad Request');
              }
              break;
            case 401:
              this.toastr.error(errorMessage, 'Unauthorized');
              // Redirect to login
              break;
            case 403:
              this.toastr.error(errorMessage, 'Forbidden');
              break;
            case 404:
              this.toastr.error(errorMessage, 'Not Found');
              break;
            case 409:
              this.toastr.error(errorMessage, 'Conflict');
              break;
            case 500:
              this.toastr.error(errorMessage, 'Server Error');
              break;
            default:
              this.toastr.error(errorMessage);
          }
        } else {
          this.toastr.error('Network error. Please try again.');
        }
        
        return throwError(() => error);
      })
    );
  }
}
```

## Validation Error Examples

### Email Validation
```json
{
  "success": false,
  "statusCode": 400,
  "message": "email must be an email",
  "error": [
    {
      "field": "email",
      "reason": "email must be an email",
      "constraints": {
        "isEmail": "email must be an email"
      }
    }
  ],
  "path": "/api/auth/register",
  "timestamp": "2024-11-02T10:30:00.000Z"
}
```

### Password Strength
```json
{
  "success": false,
  "statusCode": 400,
  "message": "password must be longer than or equal to 8 characters",
  "error": [
    {
      "field": "password",
      "reason": "password must be longer than or equal to 8 characters",
      "constraints": {
        "minLength": "password must be longer than or equal to 8 characters"
      }
    }
  ],
  "path": "/api/auth/register",
  "timestamp": "2024-11-02T10:30:00.000Z"
}
```

### Required Fields
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed: email: email should not be empty; password: password should not be empty",
  "error": [
    {
      "field": "email",
      "reason": "email should not be empty",
      "constraints": {
        "isNotEmpty": "email should not be empty"
      }
    },
    {
      "field": "password",
      "reason": "password should not be empty",
      "constraints": {
        "isNotEmpty": "password should not be empty"
      }
    }
  ],
  "path": "/api/auth/register",
  "timestamp": "2024-11-02T10:30:00.000Z"
}
```

## Best Practices for Frontend

### ✅ DO

1. **Always check `success` field** before processing response
2. **Display `message` field** to users (it's user-friendly and may be translated)
3. **Use `statusCode` for conditional logic**
4. **Iterate through `error` array** for detailed error information
5. **Check `error[].field`** to highlight specific form fields
6. **Handle 401 errors** by redirecting to login
7. **Handle 500 errors** gracefully with generic message
8. **Log full error object** to console for debugging
9. **Use i18n-aware error messages** - the backend returns translated messages based on `Accept-Language` header or `?lang=` query param

### ❌ DON'T

1. **Don't expose stack traces** to end users (they're only in development mode)
2. **Don't show technical error codes** as primary message (use `message` field instead)
3. **Don't ignore error responses**
4. **Don't assume error structure** (always check if properties exist)
5. **Don't display raw JSON** to users
6. **Don't hardcode error messages** - use the backend's message field

## Error Logging

All errors are automatically logged on the server with full context:

```typescript
// Example log entry
this.logger.error(
  `[400] POST /api/auth/register - Validation failed`,
  JSON.stringify({
    statusCode: 400,
    message: "Validation failed: email must be an email",
    path: "/api/auth/register",
    method: "POST",
    body: { email: "invalid-email", password: "123" },
    errorDetails: [
      {
        field: "email",
        reason: "email must be an email",
        constraints: { isEmail: "email must be an email" }
      }
    ]
  })
);
```

## Testing Error Responses

### Swagger/Postman

All error responses are documented in Swagger with examples:

1. Navigate to `http://localhost:3000/docs`
2. Try any endpoint with invalid data
3. Check the response structure in the response body

### cURL Examples

```bash
# Validation error
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","password":"123"}'

# With language preference (Korean)
curl -X POST http://localhost:3000/auth/register?lang=ko \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","password":"123"}'

# Unauthorized error
curl -X GET http://localhost:3000/auth/me

# Not found error
curl -X GET http://localhost:3000/users/invalid-uuid
```

## Multi-Language Support

The error handling system supports automatic language detection:

### Client-Side Language Selection

**Option 1: Query Parameter**
```typescript
// English
axios.get('/api/auth/me?lang=en')

// Korean
axios.get('/api/auth/me?lang=ko')
```

**Option 2: Accept-Language Header**
```typescript
axios.get('/api/auth/me', {
  headers: {
    'Accept-Language': 'ko'  // or 'en'
  }
})
```

### Example Multi-Language Errors

**English (default):**
```json
{
  "message": "User with email john@example.com not found",
  "error": [
    {
      "reason": "User with email john@example.com not found"
    }
  ]
}
```

**Korean:**
```json
{
  "message": "이메일 john@example.com의 사용자를 찾을 수 없습니다",
  "error": [
    {
      "reason": "이메일 john@example.com의 사용자를 찾을 수 없습니다"
    }
  ]
}
```

## Summary

✅ **Consistent Format** - All errors use `ErrorResponseDto` with `ErrorDetailDto[]`  
✅ **User-Friendly Messages** - Clear, actionable error messages via `message` field  
✅ **Detailed Validation** - Array of `ErrorDetailDto` with field-level information  
✅ **Proper Status Codes** - Standard HTTP status codes (400, 401, 403, 404, 409, 500)  
✅ **Frontend Ready** - Easy to integrate with any frontend framework  
✅ **Development Support** - Stack traces in development mode via `constraints` field  
✅ **Production Safe** - No sensitive data exposed in production  
✅ **Multi-Language** - Automatic i18n support via `I18nHelper` and `Accept-Language`/`?lang=`  
✅ **Type-Safe** - Strongly-typed DTOs for both errors and responses  
