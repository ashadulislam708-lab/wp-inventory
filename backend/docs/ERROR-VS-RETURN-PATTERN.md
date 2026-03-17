# Error Handling Pattern: Throw vs Return

## ❌ WRONG Pattern - Returning Error Objects

```typescript
// DON'T DO THIS
async login(dto: LoginDto): Promise<LoginResponsePayloadDto> {
  const user = await this.findUser(dto.email);
  
  if (!user) {
    return {
      success: false,  // ❌ Wrong!
      message: 'User not found',
    };
  }
  
  return {
    success: true,
    token: 'xxx',
    user: user,
  };
}
```

### Why This is Wrong:
1. **Transform Interceptor wraps it**: Your response becomes:
   ```json
   {
     "success": true,     // ✅ Interceptor says SUCCESS
     "statusCode": 200,   // ✅ HTTP 200
     "data": {
       "success": false,  // ❌ But data says failure?
       "message": "User not found"
     }
   }
   ```

2. **Frontend gets confused**: HTTP status is 200, but data says failure
3. **No proper error handling**: Exception filters don't catch it
4. **Inconsistent response structure**: Sometimes data, sometimes nested

## ✅ CORRECT Pattern - Throwing Exceptions

```typescript
// DO THIS
async login(dto: LoginDto): Promise<LoginResponsePayloadDto> {
  const user = await this.findUser(dto.email);
  
  if (!user) {
    throw new NotFoundException('User not found');  // ✅ Throw exception
  }
  
  if (!await this.verifyPassword(dto.password, user.password)) {
    throw new UnauthorizedException('Invalid credentials');  // ✅ Throw exception
  }
  
  // Only return on SUCCESS
  return {
    success: true,
    token: this.generateToken(user),
    user: user,
  };
}
```

### Why This is Correct:
1. **Proper HTTP status codes**:
   - `NotFoundException` → 404
   - `UnauthorizedException` → 401
   - `BadRequestException` → 400
   - `InternalServerErrorException` → 500

2. **Exception filter catches and formats**:
   ```json
   {
     "success": false,
     "statusCode": 404,
     "message": "User not found",
     "error": {
       "error": "NotFoundException"
     },
     "timestamp": "2025-11-03T18:00:00.000Z",
     "path": "/auth/login"
   }
   ```

3. **Consistent structure**: Always predictable response format
4. **Frontend knows immediately**: Check HTTP status code

## Exception Types to Use

| Scenario | Exception | HTTP Status |
|----------|-----------|-------------|
| Resource not found | `NotFoundException` | 404 |
| Invalid credentials | `UnauthorizedException` | 401 |
| Validation failed | `BadRequestException` | 400 |
| Permission denied | `ForbiddenException` | 403 |
| Server error | `InternalServerErrorException` | 500 |
| Custom business logic | `BadRequestException` | 400 |

## Complete Example

```typescript
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

@Injectable()
export class AuthService {
  async login(dto: LoginDto, language: LanguageEnum): Promise<LoginResponsePayloadDto> {
    try {
      // Find user
      const user = await this.userRepository.findOne({
        where: { email: dto.email }
      });

      // User not found - throw 404
      if (!user) {
        throw new NotFoundException(
          this.i18n.t('translation.authentication.error.user_not_registered', {
            lang: language,
          }),
        );
      }

      // Password mismatch - throw 401
      const isMatch = await this.utilsService.isMatchHash(
        dto.password,
        user.password,
      );

      if (!isMatch) {
        throw new UnauthorizedException(
          this.i18n.t('translation.authentication.error.password_does_not_match', {
            lang: language,
          }),
        );
      }

      // Account blocked - throw 400
      if (user.isActive === ActiveStatusEnum.BLOCK) {
        throw new BadRequestException(
          this.i18n.t('translation.authentication.error.account_deleted', {
            lang: language,
          }),
        );
      }

      // Only reach here on SUCCESS
      return {
        success: true,
        message: this.i18n.t('translation.authentication.success.access_granted', {
          lang: language,
        }),
        token: this.tokenService.getAccessToken(payload),
        refreshToken: refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      };

    } catch (error) {
      this.logger.error('Login error:', error);

      // Re-throw HTTP exceptions (they're already formatted)
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      // Handle unexpected database errors
      if (error instanceof QueryFailedError) {
        throw new InternalServerErrorException(
          this.i18n.t('translation.authentication.error.database_error', {
            lang: language,
          }),
        );
      }

      // Fallback for unknown errors
      throw new InternalServerErrorException(
        this.i18n.t('translation.authentication.error.something_wrong', {
          lang: language,
        }),
      );
    }
  }
}
```

## Frontend Handling

### With Axios/Fetch:
```typescript
try {
  const response = await axios.post('/auth/login', {
    email: 'user@example.com',
    password: 'password123'
  });
  
  // Success - status 200/201
  if (response.data.success) {
    console.log('Login successful:', response.data.data);
  }
} catch (error) {
  // Error - status 400/401/404/500
  if (error.response) {
    console.error('Error:', error.response.data.message);
    console.error('Status:', error.response.data.statusCode);
  }
}
```

## Key Rules

1. ✅ **THROW exceptions for errors** (validation, not found, unauthorized, etc.)
2. ✅ **RETURN objects only for success**
3. ✅ **Use try-catch to re-throw HTTP exceptions**
4. ✅ **Let exception filters handle the formatting**
5. ❌ **DON'T return `{ success: false }` objects**
6. ❌ **DON'T mix return and throw patterns**

## ⚠️ Common Pitfall: Interceptors Catching Errors

### The Problem:
```typescript
// ❌ BAD: Converting all errors to BadGatewayException
catchError((err) => throwError(() => new BadGatewayException()))
```

**This converts ALL exceptions to 502 Bad Gateway!**

- `NotFoundException` (404) → becomes 502
- `UnauthorizedException` (401) → becomes 502
- `BadRequestException` (400) → becomes 502

### The Solution:
```typescript
// ✅ GOOD: Re-throw the original error
catchError((err) => throwError(() => err))
```

**This preserves the original exception type and status code!**

- `NotFoundException` stays 404
- `UnauthorizedException` stays 401
- `BadRequestException` stays 400

## Benefits

- ✅ Consistent response structure
- ✅ Proper HTTP status codes
- ✅ Better frontend error handling
- ✅ Swagger documentation accuracy
- ✅ Easier debugging with proper stack traces
- ✅ Follows NestJS best practices
- ✅ Interceptors don't mask real errors
