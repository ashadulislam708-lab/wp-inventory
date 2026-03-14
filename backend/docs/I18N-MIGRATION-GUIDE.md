# 🌍 i18n Migration Guide - Automatic Language Detection

## Problem Before

Every controller method had to manually pass `@Query('lang')` parameter:

```typescript
// ❌ OLD WAY - Too much boilerplate
@Get()
async findAll(@Query('lang') language?: LanguageEnum) {
  return this.service.findAll(language ?? LanguageEnum.ENGLISH);
}

// Service
async findAll(language: LanguageEnum) {
  return {
    message: this.i18n.t('translation.success.found', { lang: language }),
  };
}
```

**Problems:**
- 🔴 Every endpoint needs `@Query('lang')` and `@ApiQuery()`
- 🔴 Every service method needs `language` parameter
- 🔴 Lots of boilerplate: `language ?? LanguageEnum.ENGLISH`
- 🔴 Easy to forget and cause bugs
- 🔴 Not DRY (Don't Repeat Yourself)

---

## ✅ Solution - Automatic Language Detection

Use **`I18nHelper`** with automatic context-based language detection!

### How It Works:

1. **i18n Resolvers** (already configured in your project):
   - `QueryResolver` - Checks `?lang=en` query parameter
   - `AcceptLanguageResolver` - Checks `Accept-Language` header
   - Falls back to `'en'` if neither exists

2. **I18nHelper** - Wrapper service that automatically gets language from request context

---

## 📦 What's Been Added

### 1. **I18nHelper Service**
Location: `src/core/utils/i18n.helper.ts`

```typescript
@Injectable()
export class I18nHelper {
  constructor(private readonly i18n: I18nService) {}

  // ✅ Automatic language detection from request context
  t(key: string, args?: Record<string, any>): string {
    const lang = I18nContext.current()?.lang || 'en';
    return this.i18n.t(key, { lang, ...args });
  }

  // Get current language
  getCurrentLanguage(): string {
    return I18nContext.current()?.lang || 'en';
  }

  // For background jobs/queues without request context
  tWithLang(key: string, lang: string, args?: Record<string, any>): string {
    return this.i18n.t(key, { lang, ...args });
  }

  // Check if specific language
  isLanguage(lang: string): boolean {
    return this.getCurrentLanguage() === lang;
  }

  // Get available languages from enum
  getAvailableLanguages(): string[] {
    return Object.values(LanguageEnum); // ['en', 'ko']
  }
}
```

---

## 🚀 Migration Steps

### Step 1: Remove `@Query('lang')` from Controllers

**Before:**
```typescript
import { Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { LanguageEnum } from 'src/shared/enums';

@Post('login')
@ApiQuery({
  name: 'lang',
  required: false,
  enum: LanguageEnum,
})
async login(
  @Body() dto: LoginDto,
  @Query('lang') language?: LanguageEnum,
): Promise<LoginResponsePayloadDto> {
  return await this.authService.login(dto, language ?? LanguageEnum.ENGLISH);
}
```

**After:**
```typescript
// No Query, ApiQuery, or LanguageEnum imports needed!

@Post('login')
async login(@Body() dto: LoginDto): Promise<LoginResponsePayloadDto> {
  return await this.authService.login(dto);
}
```

### Step 2: Update Service Imports

**Before:**
```typescript
import { I18nService } from 'nestjs-i18n';
import { LanguageEnum } from 'src/shared/enums';

@Injectable()
export class AuthService {
  constructor(
    private readonly i18n: I18nService,
  ) {}
}
```

**After:**
```typescript
import { I18nHelper } from '@core/utils';
// No LanguageEnum import needed!

@Injectable()
export class AuthService {
  constructor(
    private readonly i18nHelper: I18nHelper,
  ) {}
}
```

### Step 3: Remove `language` Parameter from Service Methods

**Before:**
```typescript
async login(dto: LoginDto, language: LanguageEnum): Promise<LoginResponsePayloadDto> {
  const user = await this.findUser(dto.email);
  
  if (!user) {
    throw new NotFoundException(
      this.i18n.t('translation.authentication.error.user_not_found', {
        lang: language,
      }),
    );
  }

  return {
    success: true,
    message: this.i18n.t('translation.authentication.success.login', {
      lang: language,
    }),
    data: user,
  };
}
```

**After:**
```typescript
async login(dto: LoginDto): Promise<LoginResponsePayloadDto> {
  const user = await this.findUser(dto.email);
  
  if (!user) {
    throw new NotFoundException(
      this.i18nHelper.t('translation.authentication.error.user_not_found'),
    );
  }

  return {
    success: true,
    message: this.i18nHelper.t('translation.authentication.success.login'),
    data: user,
  };
}
```

### Step 4: Update All `this.i18n.t()` Calls

**Find and Replace Pattern:**

```typescript
// Find:
this.i18n.t('key', { lang: language })
this.i18n.t('key', { lang: language, ...otherArgs })

// Replace with:
this.i18nHelper.t('key')
this.i18nHelper.t('key', { ...otherArgs })
```

**Examples:**

```typescript
// ❌ Before
this.i18n.t('translation.error.not_found', { lang: language })
this.i18n.t('translation.success.created', { lang: language, name: 'Product' })

// ✅ After
this.i18nHelper.t('translation.error.not_found')
this.i18nHelper.t('translation.success.created', { name: 'Product' })
```

---

## 📝 Complete Example

### Before (Old Way):

```typescript
// ❌ Controller
@Controller('products')
export class ProductController {
  @Get()
  @ApiQuery({ name: 'lang', required: false, enum: LanguageEnum })
  async findAll(@Query('lang') language?: LanguageEnum) {
    return this.service.findAll(language ?? LanguageEnum.ENGLISH);
  }

  @Post()
  @ApiQuery({ name: 'lang', required: false, enum: LanguageEnum })
  async create(
    @Body() dto: CreateProductDto,
    @Query('lang') language?: LanguageEnum,
  ) {
    return this.service.create(dto, language ?? LanguageEnum.ENGLISH);
  }
}

// ❌ Service
@Injectable()
export class ProductService {
  constructor(private readonly i18n: I18nService) {}

  async findAll(language: LanguageEnum) {
    const products = await this.repository.find();
    return {
      message: this.i18n.t('translation.product.success.found', {
        lang: language,
      }),
      data: products,
    };
  }

  async create(dto: CreateProductDto, language: LanguageEnum) {
    const product = await this.repository.save(dto);
    
    if (!product) {
      throw new BadRequestException(
        this.i18n.t('translation.product.error.create_failed', {
          lang: language,
        }),
      );
    }

    return {
      message: this.i18n.t('translation.product.success.created', {
        lang: language,
        name: product.name,
      }),
      data: product,
    };
  }
}
```

### After (New Way):

```typescript
// ✅ Controller - Clean and simple!
@Controller('products')
export class ProductController {
  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Post()
  async create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }
}

// ✅ Service - No language parameters!
@Injectable()
export class ProductService {
  constructor(private readonly i18nHelper: I18nHelper) {}

  async findAll() {
    const products = await this.repository.find();
    return {
      message: this.i18nHelper.t('translation.product.success.found'),
      data: products,
    };
  }

  async create(dto: CreateProductDto) {
    const product = await this.repository.save(dto);
    
    if (!product) {
      throw new BadRequestException(
        this.i18nHelper.t('translation.product.error.create_failed'),
      );
    }

    return {
      message: this.i18nHelper.t('translation.product.success.created', {
        name: product.name,
      }),
      data: product,
    };
  }
}
```

---

## 🎯 How Language Detection Works

### 1. **Client sends language via query parameter:**
```bash
GET /api/products?lang=ko
```
→ Returns Korean messages

### 2. **Client sends language via header:**
```bash
GET /api/products
Header: Accept-Language: ko
```
→ Returns Korean messages

### 3. **No language specified:**
```bash
GET /api/products
```
→ Returns English messages (default)

### 4. **In service, get current language:**
```typescript
const currentLang = this.i18nHelper.getCurrentLanguage(); // 'en' or 'ko'

if (this.i18nHelper.isLanguage('ko')) {
  // Korean-specific logic
}
```

---

## 🔧 Special Cases

### Background Jobs / Queues (No Request Context)

When there's no HTTP request (scheduled tasks, queue workers), use `tWithLang()`:

```typescript
@Injectable()
export class EmailService {
  constructor(private readonly i18nHelper: I18nHelper) {}

  async sendWelcomeEmail(user: User) {
    // Use user's preferred language explicitly
    const subject = this.i18nHelper.tWithLang(
      'translation.email.welcome.subject',
      user.preferredLanguage || 'en',
      { name: user.fullName }
    );

    await this.mailService.send({
      to: user.email,
      subject,
      template: 'welcome',
    });
  }
}
```

### Testing

In unit tests, mock I18nContext:

```typescript
import { I18nContext } from 'nestjs-i18n';

describe('ProductService', () => {
  beforeEach(() => {
    // Mock i18n context
    jest.spyOn(I18nContext, 'current').mockReturnValue({
      lang: 'en',
    } as any);
  });

  it('should create product with English message', async () => {
    const result = await service.create(dto);
    expect(result.message).toContain('created'); // English message
  });
});
```

---

## ✅ Migration Checklist

Use this checklist for each module:

### Controller Changes:
- [ ] Remove `@Query('lang') language?: LanguageEnum` from all methods
- [ ] Remove `@ApiQuery({ name: 'lang', ... })` decorators
- [ ] Remove `language ?? LanguageEnum.ENGLISH` fallback logic
- [ ] Remove `LanguageEnum` import if not used elsewhere
- [ ] Remove `Query` from @nestjs/common import if not used elsewhere
- [ ] Remove `ApiQuery` from @nestjs/swagger import if not used elsewhere

### Service Changes:
- [ ] Replace `I18nService` with `I18nHelper` in constructor
- [ ] Update imports: `import { I18nHelper } from '@core/utils'`
- [ ] Remove `LanguageEnum` import
- [ ] Remove `language: LanguageEnum` parameter from all methods
- [ ] Replace `this.i18n` with `this.i18nHelper` in all methods
- [ ] Replace `this.i18n.t('key', { lang: language })` with `this.i18nHelper.t('key')`
- [ ] Replace `this.i18n.t('key', { lang: language, ...args })` with `this.i18nHelper.t('key', { ...args })`

---

## 📊 Files Modified

### ✅ Already Updated:
- `src/core/utils/i18n.helper.ts` - New helper service created
- `src/core/utils/index.ts` - Exports I18nHelper
- `src/modules/auth/auth.controller.ts` - Removed all `@Query('lang')`

### ⏰ Need Manual Update:
You need to remove `language` parameters from ALL methods in these files:

#### auth.service.ts Methods:
```typescript
// Find all these method signatures and remove language parameter:
async login(userLogin: LoginDto, language: LanguageEnum) // Remove language
async adminLogin(dto: LoginDto, language: LanguageEnum) // Remove language
async socialLogin(dto: SocialLoginDto, language: LanguageEnum) // Remove language
async appleLogin(data: AppleLoginDto, language: LanguageEnum) // Remove language
async changePassword(user: IJwtPayload, dto: ChangePasswordDto, language: LanguageEnum) // Remove language
async changeUserPassword(user: IJwtPayload, dto: ChangeUserPasswordDto, language: LanguageEnum) // Remove language
async forgotPassword(dto: ForgotPasswordDto, language: LanguageEnum) // Remove language
async resetPassword(dto: ResetPasswordDto, language: LanguageEnum) // Remove language
async refreshAccessToken(refreshToken: string, language: LanguageEnum) // Remove language
async getUserInformation(user: IJwtPayload, language: LanguageEnum) // Remove language
async logout(user: IJwtPayload, language: LanguageEnum) // Remove language
async registerFcmToken(user: IJwtPayload, dto: RegisterFcmTokenDto, language: LanguageEnum) // Remove language
```

#### otp.controller.ts:
- [ ] Remove `@Query('lang')` from `send()` method
- [ ] Remove `@Query('lang')` from `verify()` method
- [ ] Remove `@ApiQuery` decorators
- [ ] Remove `LanguageEnum` import

#### otp.service.ts:
- [ ] Remove `language` parameter from `send()` method
- [ ] Remove `language` parameter from `verify()` method
- [ ] Replace `this.i18n` with `this.i18nHelper`
- [ ] Update all translation calls

---

## 🎉 Benefits

### Before (Old Way):
- **Controllers**: 50+ lines of boilerplate (`@Query`, `@ApiQuery`, fallback logic)
- **Services**: Every method needs `language` parameter
- **Maintenance**: Easy to forget language parameter
- **Testing**: Need to pass language in every test

### After (New Way):
- **Controllers**: Clean, no language parameters!
- **Services**: Automatic language detection
- **Maintenance**: Can't forget - it's automatic!
- **Testing**: No language parameters needed

### Code Reduction:
```
Before: ~200 lines of language-related boilerplate
After: ~0 lines - fully automatic! 🎉
```

---

## 🚨 Important Notes

1. **i18n Resolvers must be configured** (already done in your `app.module.ts`):
```typescript
I18nModule.forRoot({
  fallbackLanguage: 'en',
  loaderOptions: {
    path: path.join(__dirname, '/i18n/'),
    watch: true,
  },
  resolvers: [
    { use: QueryResolver, options: ['lang'] },  // ✅ Checks ?lang=en
    AcceptLanguageResolver,                      // ✅ Checks Accept-Language header
  ],
})
```

2. **Request Context Required**: `I18nHelper.t()` works in HTTP request context only. For background jobs, use `tWithLang()`.

3. **Backward Compatible**: Old endpoints with `?lang=en` still work! Clients don't need to change anything.

---

## 📚 Additional Resources

- [nestjs-i18n Documentation](https://nestjs-i18n.com/)
- See `AUTHENTICATION-GUIDE.md` for auth examples
- See `ERROR-HANDLING-GUIDE.md` for error messages
- See `FEATURES-DEMO-GUIDE.md` for complete examples

---

**🎯 Goal**: Remove ALL manual language passing and use automatic detection everywhere!
