# 🚀 NestJS Starter Kit - Developer Onboarding Guide

> **Welcome to Potential Inc's Official NestJS Starter Kit!**  
> This is our company-wide standardized architecture for all NestJS projects.

---

## 📋 Table of Contents

1. [Why This Matters](#why-this-matters)
2. [Getting Started](#getting-started)
3. [Architecture Overview](#architecture-overview)
4. [Git Workflow (MANDATORY)](#git-workflow-mandatory)
5. [Code Quality Standards](#code-quality-standards)
6. [How to Contribute](#how-to-contribute)
7. [Adding New Features](#adding-new-features)
8. [Reporting Issues](#reporting-issues)
9. [Documentation](#documentation)
10. [Best Practices](#best-practices)

---

## 🎯 Why This Matters

This starter kit is the **foundation** of all our NestJS projects at Potential Inc. By following this structure:

✅ **Consistency**: All team members work with the same patterns  
✅ **Quality**: Automated checks ensure code meets our standards  
✅ **Efficiency**: Base classes reduce boilerplate by 70%  
✅ **Scalability**: Proven architecture that grows with your project  
✅ **Maintainability**: Clear structure makes debugging and updates easier

> **⚠️ IMPORTANT**: This is NOT optional. All developers MUST follow this structure and workflow.

---

## 🚀 Getting Started

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/potentialInc/nestjs-starter-kit.git
cd nestjs-starter-kit

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Setup Git hooks (REQUIRED)
npm run prepare

# Run database migrations
npm run migration:run

# Start development server with real-time linting
npm run start:dev
```

### 2. Verify Your Setup

```bash
# Run all checks
npm run type-check
npm run lint
npm run test

# If all pass, you're ready! ✅
```

---

## 🏗️ Architecture Overview

Our architecture follows a **four-layer pattern** that's consistent across all projects:

```
┌─────────────────────────────────────────┐
│         Controller Layer                │
│  (HTTP Endpoints, Validation)          │
│  → Extends BaseController               │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Service Layer                   │
│  (Business Logic, Validation)          │
│  → Extends BaseService                  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Repository Layer                │
│  (Database Operations)                  │
│  → Extends BaseRepository               │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Entity Layer                    │
│  (Database Schema)                      │
│  → Extends BaseEntity                   │
└─────────────────────────────────────────┘
```

### Key Features:

- ✅ **BaseEntity**: Auto-generates `id`, `createdAt`, `updatedAt`, `deletedAt`
- ✅ **BaseRepository**: CRUD operations out of the box
- ✅ **BaseService**: Business logic with built-in validation
- ✅ **BaseController**: Standardized REST endpoints with response formatting
- ✅ **Response System**: Consistent API responses across all endpoints
- ✅ **Error Handling**: Global exception filters with i18n support
- ✅ **Authentication**: JWT + Cookie-based auth ready to use
- ✅ **Real-time Linting**: See errors as you code (not just on push!)

📚 **Read**: `docs/BASE-CONTROLLER-GUIDE.md` for complete architecture details

---

## 🔒 Git Workflow (MANDATORY)

### Automated Quality Checks

We use **Husky** to enforce quality. Every commit and push triggers automatic checks:

#### On Commit (Pre-commit Hook):

- ✅ ESLint auto-fixes your code
- ✅ Prettier formats your code
- ✅ Only staged files are checked (fast!)

#### On Push (Pre-push Hook):

- ✅ TypeScript type checking
- ✅ Full project linting
- ✅ All tests must pass
- ✅ Project must build successfully

**If any check fails, your push will be blocked!** This ensures only quality code reaches the repository.

### Branch Naming Convention

```bash
# Feature branches
feat/feature-name          # New features
fix/bug-description        # Bug fixes
refactor/what-changed      # Code refactoring
docs/what-documented       # Documentation
test/what-tested           # Test additions

# Examples
feat/sms-gateway-solapie
fix/login-timeout
refactor/user-service-optimization
```

### Commit Message Format (MANDATORY)

We follow **Conventional Commits**. Format: `<type>(<scope>): <description>`

**Valid Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code formatting
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Tests
- `chore`: Maintenance

✅ **Valid Examples:**

```bash
git commit -m "feat: add SMS gateway integration"
git commit -m "fix: resolve user login timeout"
git commit -m "docs: update API documentation"
git commit -m "refactor(auth): simplify JWT validation"
```

❌ **Invalid Examples:**

```bash
git commit -m "Added SMS"           # Missing type
git commit -m "Fix: bug fix"        # Wrong capitalization
git commit -m "update code"         # No type specified
```

📚 **Read**: `docs/GIT-WORKFLOW-GUIDE.md` and `docs/HUSKY-QUICK-REFERENCE.md`

---

## 🎨 Code Quality Standards

### Real-Time Linting

When you run `npm run start:dev`, linting happens automatically:

```bash
npm run start:dev
# This runs:
# - NestJS server in watch mode
# - ESLint in watch mode (shows errors as you code!)
```

**Benefits:**

- See errors immediately as you save files
- Fix issues before committing
- No surprises during git push

### ESLint Auto-Fix on Save

Install the **ESLint extension** in VS Code:

1. Press `Ctrl+Shift+X`
2. Search "ESLint"
3. Install by Microsoft
4. Reload VS Code

Now every time you save a file (`Ctrl+S`):

- Code automatically formats
- ESLint issues auto-fix
- Unused imports removed

### Manual Commands

```bash
# Format all files
npm run format

# Check linting
npm run lint:check

# Fix linting issues
npm run lint

# Type checking
npm run type-check

# Run tests
npm run test
```

---

## 🤝 How to Contribute

### Example: Adding SMS Gateway (Solapie)

**Step 1: Create a Feature Branch**

```bash
git checkout -b feat/sms-gateway-solapie
```

**Step 2: Create Module Structure**

```bash
src/infrastructure/sms/
├── sms.service.ts
├── sms.module.ts
└── interfaces/
    └── sms.interface.ts
```

**Step 3: Implement Feature**

```typescript
// src/infrastructure/sms/sms.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class SmsService {
    async sendSMS(phone: string, message: string): Promise<void> {
        // Implement Solapie SMS gateway integration
    }
}
```

**Step 4: Write Tests**

```typescript
// src/infrastructure/sms/sms.service.spec.ts
describe('SmsService', () => {
    // Add unit tests
});
```

**Step 5: Update Documentation**

```markdown
# Create docs/SMS-GATEWAY-GUIDE.md

- How to configure
- API usage examples
- Error handling
```

**Step 6: Commit and Push**

```bash
git add .
git commit -m "feat: integrate Solapie SMS gateway"
git push origin feat/sms-gateway-solapie
```

**Step 7: Create Pull Request**

1. Go to GitHub repository
2. Click "New Pull Request"
3. Base: `main` ← Compare: `feat/sms-gateway-solapie`
4. Title: `feat: integrate Solapie SMS gateway`
5. Description:

    ```markdown
    ## What Changed

    - Added SMS service for Solapie gateway
    - Integrated with notification system
    - Added unit tests and documentation

    ## Testing

    - [ ] Unit tests pass
    - [ ] Manual testing completed
    - [ ] Documentation updated

    ## Related Issues

    Closes #123
    ```

6. Request review from team lead
7. Wait for approval and merge

---

## 🐛 Reporting Issues

### When to Create an Issue

- 🐛 Found a bug in the starter kit
- 💡 Have an improvement idea
- 📚 Documentation is unclear
- ⚠️ Security vulnerability
- 🤔 Need clarification on architecture

### How to Report

**Go to**: [GitHub Issues](https://github.com/potentialInc/nestjs-starter-kit/issues)

**Click**: "New Issue"

**Template**:

```markdown
## Issue Type

- [ ] Bug
- [ ] Feature Request
- [ ] Documentation
- [ ] Question

## Description

Clear description of the issue

## Steps to Reproduce (for bugs)

1. Step one
2. Step two
3. Expected vs Actual result

## Environment

- Node version: 20.x
- npm version: 10.x
- OS: Windows/Mac/Linux

## Proposed Solution (optional)

Your suggestion for fixing the issue
```

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or improvement
- `documentation` - Documentation improvements
- `help wanted` - Extra attention needed
- `good first issue` - Good for newcomers

---

## 📚 Documentation

### Must-Read Documents (Priority Order)

1. **GIT-WORKFLOW-GUIDE.md** - Git workflow and commit standards
2. **BASE-CONTROLLER-GUIDE.md** - Four-layer architecture explained
3. **RESPONSE-SYSTEM-SUMMARY.md** - API response format
4. **AUTHENTICATION-GUIDE.md** - JWT authentication setup
5. **ERROR-HANDLING-GUIDE.md** - Exception handling patterns
6. **DOCKER.md** - Docker setup and deployment

### Full Documentation List

```
docs/
├── AUTHENTICATION-GUIDE.md         # JWT & Cookie auth
├── BASE-CONTROLLER-GUIDE.md        # Architecture patterns
├── DEPLOYMENT-CHECKLIST.md         # Production deployment
├── ERROR-HANDLING-GUIDE.md         # Error patterns
├── ERROR-VS-RETURN-PATTERN.md      # Error handling philosophy
├── EXCEPTION-HANDLING-GUIDE.md     # Global exception filters
├── FEATURES-DEMO-GUIDE.md          # Feature examples
├── GIT-WORKFLOW-GUIDE.md           # Git standards (MANDATORY)
├── HUSKY-QUICK-REFERENCE.md        # Quick Git hooks guide
├── I18N-MIGRATION-GUIDE.md         # Internationalization
├── ONE-DECORATOR-GUIDE.md          # Custom decorators
├── PRODUCTION-MODE-GUIDE.md        # Production setup
├── RESPONSE-LAYOUT-GUIDE.md        # API responses
├── RESPONSE-SYSTEM-SUMMARY.md      # Response quick ref
└── TRANSFORM-INTERCEPTOR-GUIDE.md  # Response transformation
```

---

## ✨ Best Practices

### DO's ✅

1. **Always extend base classes** when creating new modules

    ```typescript
    export class UserController extends BaseController<
        User,
        CreateUserDto,
        UpdateUserDto
    > {}
    ```

2. **Use response DTOs** for consistent API responses

    ```typescript
    return new SuccessResponseDto(data, 'Operation successful');
    ```

3. **Write commit messages** following conventional commits

    ```bash
    git commit -m "feat: add user profile feature"
    ```

4. **Create feature branches** for all changes

    ```bash
    git checkout -b feat/new-feature
    ```

5. **Run `npm run start:dev`** to see linting errors in real-time

6. **Write tests** for all new features

    ```typescript
    describe('FeatureService', () => {
        /* tests */
    });
    ```

7. **Update documentation** when adding features

8. **Use environment variables** for configuration

    ```typescript
    process.env.DATABASE_URL;
    ```

9. **Follow TypeScript best practices** (strict mode enabled)

10. **Create PRs with detailed descriptions**

### DON'Ts ❌

1. ❌ **Don't commit directly to `main`** - Always use feature branches
2. ❌ **Don't skip Git hooks** - They're there for a reason
3. ❌ **Don't use `any` type** - Use proper TypeScript types
4. ❌ **Don't ignore linting errors** - Fix them before committing
5. ❌ **Don't hardcode secrets** - Use environment variables
6. ❌ **Don't create duplicate code** - Use base classes
7. ❌ **Don't skip tests** - Write tests for new features
8. ❌ **Don't merge without review** - Always request PR review
9. ❌ **Don't bypass pre-push hooks** - Fix issues instead
10. ❌ **Don't forget to update documentation**

---

## 🐳 Docker Support

Full Docker support is included:

```bash
# Development mode (hot reload)
npm run docker:dev

# Production mode
npm run docker:prod

# View logs
npm run docker:logs

# Stop services
npm run docker:dev:down
```

📚 **Read**: `README.DOCKER.md` for complete Docker guide

---

## 🆘 Getting Help

### Internal Resources

1. **Documentation**: Check `docs/` folder first
2. **GitHub Issues**: Search existing issues
3. **Team Lead**: Contact your team lead
4. **Code Review**: Ask during PR review

### External Resources

1. **NestJS Docs**: https://docs.nestjs.com
2. **TypeScript Docs**: https://www.typescriptlang.org/docs
3. **TypeORM Docs**: https://typeorm.io

---

## 🎯 Quick Reference

### Common Commands

```bash
# Development
npm run start:dev              # Start with real-time linting
npm run start:dev:server       # Start server only (no linting)

# Code Quality
npm run lint                   # Fix linting issues
npm run lint:check             # Check linting (no fix)
npm run format                 # Format all files
npm run type-check             # TypeScript type checking

# Testing
npm run test                   # Run unit tests
npm run test:watch             # Watch mode
npm run test:cov               # Coverage report
npm run test:e2e               # End-to-end tests

# Database
npm run migration:generate     # Generate migration
npm run migration:run          # Run migrations
npm run migration:revert       # Revert last migration
npm run seed:run               # Run seeders

# Docker
npm run docker:dev             # Start dev environment
npm run docker:prod            # Start production
npm run docker:logs            # View logs
npm run docker:clean           # Clean everything

# Build
npm run build                  # Build for production
npm run start:prod             # Run production build
```

### Project Structure

```
nestjs-starter-kit/
├── src/
│   ├── core/                  # Core framework code
│   │   ├── base/              # Base classes (Controller, Service, etc.)
│   │   ├── decorators/        # Custom decorators
│   │   ├── filters/           # Exception filters
│   │   ├── guards/            # Auth guards
│   │   ├── interceptors/      # Request/response interceptors
│   │   └── pipes/             # Validation pipes
│   ├── modules/               # Feature modules
│   │   ├── auth/              # Authentication
│   │   ├── users/             # User management
│   │   └── features/          # Demo features
│   ├── shared/                # Shared resources
│   │   ├── dtos/              # Response DTOs
│   │   ├── constants/         # App constants
│   │   └── interfaces/        # TypeScript interfaces
│   ├── infrastructure/        # Infrastructure services
│   │   ├── mail/              # Email service
│   │   ├── s3/                # File storage
│   │   └── logging/           # Logging service
│   ├── database/              # Database related
│   │   ├── migrations/        # TypeORM migrations
│   │   └── seeders/           # Database seeders
│   └── config/                # Configuration files
├── docs/                      # Documentation (READ THIS!)
├── test/                      # E2E tests
└── logs/                      # Application logs
```

---

## 🎓 Onboarding Checklist

Before you start coding, complete this checklist:

- [ ] Cloned repository and installed dependencies
- [ ] Read `docs/GIT-WORKFLOW-GUIDE.md`
- [ ] Read `docs/BASE-CONTROLLER-GUIDE.md`
- [ ] Installed ESLint extension in VS Code
- [ ] Verified Git hooks work (`git commit` triggers checks)
- [ ] Ran `npm run start:dev` and saw real-time linting
- [ ] Created a test branch and made a test commit
- [ ] Read `docs/RESPONSE-SYSTEM-SUMMARY.md`
- [ ] Understood conventional commit format
- [ ] Know how to create issues and PRs
- [ ] Bookmarked this document for reference

---

## 🚨 IMPORTANT REMINDERS

1. **This structure is MANDATORY** - Not a suggestion
2. **All code MUST pass Git hooks** - Fix errors, don't bypass
3. **Always create feature branches** - Never commit to `main`
4. **Follow conventional commits** - Your commits will be rejected otherwise
5. **Write tests** - Code without tests is incomplete
6. **Update documentation** - If you add features, document them
7. **Request code reviews** - Never merge without approval
8. **Use base classes** - Don't reinvent the wheel
9. **Real-time linting is your friend** - Use `npm run start:dev`
10. **Ask questions** - Better to ask than make mistakes

---

## 💬 Final Words

Welcome to the team! This starter kit represents months of architectural decisions, best practices, and lessons learned. By following these standards, you're not just writing code—you're contributing to a maintainable, scalable, and professional codebase that the entire company relies on.

**Remember:**

- Quality over speed
- Consistency over cleverness
- Teamwork over individual preferences
- Documentation is as important as code

**Let's build amazing things together! 🚀**

---

## 📞 Contact

- **Technical Lead**: [Your Lead's Name]
- **GitHub Issues**: https://github.com/potentialInc/nestjs-starter-kit/issues
- **Slack Channel**: #nestjs-development
- **Email**: dev-team@potentialai.com

---

**Last Updated**: November 10, 2025  
**Version**: 1.0.0  
**Maintained by**: Potential Inc Development Team
