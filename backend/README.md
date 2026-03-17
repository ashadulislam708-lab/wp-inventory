<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<h1 align="center">NestJS Starter Kit</h1>

<p align="center">
  <strong>Potential Inc's Official Company-Wide NestJS Standard</strong>
</p>

<p align="center">
  A production-ready, enterprise-grade NestJS starter kit with standardized architecture, automated code quality enforcement, and best practices built-in.
</p>

---

## 📋 Overview

This is **Potential Inc's official NestJS Starter Kit** - a comprehensive foundation for building scalable, maintainable, and high-quality backend applications. This is the **mandatory standard** for all NestJS projects across the company.

### 🎯 What Makes This Different?

Unlike a basic NestJS starter, this kit provides:

- ✅ **Four-layer architecture** (Controller → Service → Repository → Entity)
- ✅ **Base classes** that eliminate 70% of boilerplate code
- ✅ **Standardized API responses** across all endpoints
- ✅ **Automated code quality** enforcement via Git hooks
- ✅ **Real-time linting** during development
- ✅ **Built-in authentication** (JWT + Cookie-based)
- ✅ **Comprehensive error handling** with i18n support
- ✅ **Docker-ready** deployment configuration
- ✅ **15+ documentation guides** for best practices

### 🚀 Key Benefits

**For Developers:**

- New project setup: 2-3 days → **30 minutes**
- Feature development: 500 lines → **50 lines** (90% reduction)
- Real-time error detection as you code
- Auto-fixing on save with ESLint
- Clear patterns and expectations

**For the Company:**

- Consistent codebase across all projects
- Faster onboarding (hours instead of weeks)
- Fewer bugs in production
- Easier code reviews and maintenance
- Scalable architecture proven in production

### 🏗️ Architecture

**Four-Layer Pattern:**

- **Controller Layer**: HTTP endpoints and request handling
- **Service Layer**: Business logic and validation (extends BaseService)
- **Repository Layer**: Database access and queries (extends BaseRepository)
- **Entity Layer**: Database schema and models (extends BaseEntity)

**Example Impact:** Adding a new "Products" feature requires only 50 lines of code instead of 500+. All CRUD operations, validation, error handling, and API responses are automatically handled by the base classes.

---

## 🚦 Quick Start

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- PostgreSQL 14+ (or Docker)
- Git

### Installation

**Step 1: Clone the repository**

```bash
git clone https://github.com/potentialInc/nestjs-starter-kit.git
cd nestjs-starter-kit
```

**Step 2: Install dependencies**

```bash
npm install
```

**Step 3: Setup Git hooks (REQUIRED)**

```bash
npm run prepare
```

**Step 4: Configure environment**

```bash
cp .env.example .env
```

**Step 5: Run database migrations**

```bash
npm run migration:run
```

**Step 6: Start development server**

```bash
npm run start:dev
```

### First Steps

1. **Install ESLint Extension** in VS Code (`Ctrl+Shift+X` → Search "ESLint")
2. **Read the documentation** in order:
    - `docs/DEVELOPER-ONBOARDING.md` - Complete onboarding guide
    - `docs/GIT-WORKFLOW-GUIDE.md` - Git standards (MANDATORY)
    - `docs/BASE-CONTROLLER-GUIDE.md` - Architecture explained
3. **Verify setup** by running `npm run lint` and `npm run test`

---

## 📚 Documentation

### Must-Read Documents

| Document                                                        | Description                    | Priority    |
| --------------------------------------------------------------- | ------------------------------ | ----------- |
| [/DEVELOPER-ONBOARDING.md](./docs/DEVELOPER-ONBOARDING.md)      | Complete onboarding guide      | 🔴 Critical |
| [TEAM-ANNOUNCEMENT.md](./docs/TEAM-ANNOUNCEMENT.md)             | Quick reference overview       | 🔴 Critical |
| [GIT-WORKFLOW-GUIDE.md](./docs/GIT-WORKFLOW-GUIDE.md)           | Git hooks and commit standards | 🔴 Critical |
| [BASE-CONTROLLER-GUIDE.md](./docs/BASE-CONTROLLER-GUIDE.md)     | Four-layer architecture        | 🟡 High     |
| [RESPONSE-SYSTEM-SUMMARY.md](./docs/RESPONSE-SYSTEM-SUMMARY.md) | API response format            | 🟡 High     |
| [AUTHENTICATION-GUIDE.md](./docs/AUTHENTICATION-GUIDE.md)       | JWT authentication             | 🟢 Medium   |
| [ERROR-HANDLING-GUIDE.md](./docs/ERROR-HANDLING-GUIDE.md)       | Exception handling             | 🟢 Medium   |
| [README.DOCKER.md](./README.DOCKER.md)                          | Docker setup and deployment    | 🟢 Medium   |

### Full Documentation

```
docs/
├── AUTHENTICATION-GUIDE.md         # JWT & Cookie authentication
├── BASE-CONTROLLER-GUIDE.md        # Architecture patterns (MUST READ)
├── DEPLOYMENT-CHECKLIST.md         # Production deployment guide
├── ERROR-HANDLING-GUIDE.md         # Error handling patterns
├── EXCEPTION-HANDLING-GUIDE.md     # Global exception filters
├── FEATURES-DEMO-GUIDE.md          # Feature examples
├── GIT-WORKFLOW-GUIDE.md           # Git standards (MANDATORY)
├── HUSKY-QUICK-REFERENCE.md        # Quick Git hooks reference
├── I18N-MIGRATION-GUIDE.md         # Internationalization
├── ONE-DECORATOR-GUIDE.md          # Custom decorators
├── PRODUCTION-MODE-GUIDE.md        # Production setup
├── RESPONSE-LAYOUT-GUIDE.md        # API response details
├── RESPONSE-SYSTEM-SUMMARY.md      # Response quick reference
└── TRANSFORM-INTERCEPTOR-GUIDE.md  # Response transformation
```

---

## 🎯 Core Features

### 1. Base Classes (70% Less Boilerplate)

Extend base classes to get full CRUD functionality automatically. Simply inherit from BaseController, BaseService, and BaseRepository to have all standard operations ready: GET all, GET by ID, POST create, PATCH update, DELETE soft-delete.

### 2. Automated Code Quality

**Git Hooks Enforce Quality:**

- **Pre-commit**: Auto-fixes formatting and linting on staged files
- **Pre-push**: Runs type-check, linting, tests, and build
- **Commit-msg**: Validates conventional commit format

**Real-Time Development:**
Run `npm run start:dev` to see errors as you code and fix them immediately!

### 3. Standardized API Responses

All endpoints return consistent response format with success status, status code, message, data, timestamp, and request path. See RESPONSE-SYSTEM-SUMMARY.md for details.

### 4. Built-in Authentication

JWT + Cookie-based authentication ready to use:

- Secure token handling
- Refresh token support
- Role-based access control (RBAC)
- Custom decorators (`@CurrentUser()`, `@Public()`, `@Roles()`)

### 5. Docker Support

Production-ready Docker configuration with simple commands for development and production environments.

---

## 💻 Development

---

## 💻 Development

### Available Scripts

**Development:**

- `npm run start:dev` - Start with real-time linting (recommended)
- `npm run start:dev:server` - Start server only (no linting watch)
- `npm run start:debug` - Start in debug mode
- `npm run start:prod` - Run production build

**Code Quality:**

- `npm run lint` - Fix linting issues
- `npm run lint:check` - Check linting (no fix)
- `npm run lint:watch` - Watch mode for linting
- `npm run format` - Format all files with Prettier
- `npm run type-check` - TypeScript type checking

**Testing:**

- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:ci` - Run tests in CI mode

**Database:**

- `npm run migration:generate` - Generate migration
- `npm run migration:create` - Create empty migration
- `npm run migration:run` - Run migrations
- `npm run migration:revert` - Revert last migration
- `npm run seed:run` - Run database seeders

**Docker:**

- `npm run docker:dev` - Start development environment
- `npm run docker:dev:build` - Build and start dev environment
- `npm run docker:prod` - Start production environment
- `npm run docker:logs` - View Docker logs
- `npm run docker:clean` - Clean Docker volumes

**Build:**

- `npm run build` - Build for production

### Git Workflow (Enforced by Automation)

**Branch Naming Convention:**

- `feat/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `refactor/what-changed` - Code refactoring
- `docs/what-documented` - Documentation

**Commit Message Format (MANDATORY):**

✅ Valid examples:

- `git commit -m "feat: add user authentication"`
- `git commit -m "fix: resolve login timeout issue"`
- `git commit -m "docs: update API documentation"`
- `git commit -m "refactor(auth): simplify JWT validation"`

❌ Invalid (will be rejected by Git hooks):

- `git commit -m "added feature"`
- `git commit -m "Fix bug"`
- `git commit -m "update"`

**What Happens Automatically:**

- ✅ **On Commit**: ESLint auto-fixes code, Prettier formats files
- ✅ **On Push**: Type-check, linting, tests, and build run
- ❌ **If Checks Fail**: Push is blocked until issues are fixed

📚 **Full details**: See [GIT-WORKFLOW-GUIDE.md](./docs/GIT-WORKFLOW-GUIDE.md)

---

## 🤝 Contributing

### Adding New Features

**Step 1:** Create feature branch

```bash
git checkout -b feat/sms-gateway-solapie
```

**Step 2:** Follow the architecture structure under `src/infrastructure/` or `src/modules/`

**Step 3:** Write tests for your feature

**Step 4:** Commit and push

```bash
git commit -m "feat: integrate Solapie SMS gateway"
git push origin feat/sms-gateway-solapie
```

**Step 5:** Create Pull Request

- Describe what changed and why
- Link related issues
- Request review from team lead
- Wait for approval before merging

📚 **Detailed guide**: See "How to Contribute" section in [DEVELOPER-ONBOARDING.md](./DEVELOPER-ONBOARDING.md)

### Reporting Issues

Found a bug? Documentation unclear? Have an idea?

👉 **Create an issue**: [GitHub Issues](https://github.com/potentialInc/nestjs-starter-kit/issues)

**Include:**

- Issue type (bug/feature/docs/question)
- Clear description
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Your proposed solution (optional)

---

## 🔄 Continuous Improvement

**This is a living project.** We're actively improving it based on real-world usage and feedback.

- 💡 **Have ideas?** Create an issue or PR
- 🐛 **Found bugs?** Report them on GitHub
- 📚 **Documentation unclear?** Let us know
- 🚀 **Want to contribute?** PRs are welcome!

Your feedback and contributions help make this better for everyone.

---

## 📁 Project Structure

```
nestjs-starter-kit/
├── src/
│   ├── core/                      # Core framework code
│   │   ├── base/                  # Base classes (Controller, Service, Repository, Entity)
│   │   ├── decorators/            # Custom decorators (@CurrentUser, @Public, @Roles)
│   │   ├── filters/               # Exception filters
│   │   ├── guards/                # Authentication & authorization guards
│   │   ├── interceptors/          # Request/response interceptors
│   │   └── pipes/                 # Validation pipes
│   ├── modules/                   # Feature modules
│   │   ├── auth/                  # Authentication module
│   │   ├── users/                 # User management
│   │   └── features/              # Demo features
│   ├── shared/                    # Shared resources
│   │   ├── dtos/                  # Response DTOs
│   │   ├── constants/             # Application constants
│   │   ├── enums/                 # Enums
│   │   └── interfaces/            # TypeScript interfaces
│   ├── infrastructure/            # Infrastructure services
│   │   ├── mail/                  # Email service
│   │   ├── s3/                    # File storage (AWS S3)
│   │   ├── logging/               # Winston logger
│   │   └── token/                 # Token management
│   ├── database/                  # Database related
│   │   ├── migrations/            # TypeORM migrations
│   │   └── seeders/               # Database seeders
│   ├── config/                    # Configuration files
│   └── i18n/                      # Internationalization
├── docs/                          # Documentation (READ THIS!)
├── test/                          # E2E tests
├── .husky/                        # Git hooks
└── logs/                          # Application logs
```

---

## 🛠️ Tech Stack

- **Framework**: NestJS 11+
- **Language**: TypeScript 5.7+
- **Database**: PostgreSQL 14+ with TypeORM
- **Authentication**: JWT + Cookie-based
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Linting**: ESLint + Prettier
- **Git Hooks**: Husky
- **Containerization**: Docker + Docker Compose
- **Logger**: Winston
- **i18n**: nestjs-i18n

---

## 🔒 Security

- ✅ JWT token-based authentication
- ✅ Cookie-based token storage (HttpOnly, Secure)
- ✅ Password hashing with bcrypt
- ✅ Input validation on all endpoints
- ✅ SQL injection protection (TypeORM)
- ✅ CORS configuration
- ✅ Rate limiting with throttler
- ✅ Environment variable validation

---

## 📊 What's Included

### ✅ Ready to Use

- Full CRUD base classes
- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- API response standardization
- Global error handling
- Request logging
- Database migrations & seeders
- Email service integration
- File upload (AWS S3)
- Internationalization (i18n)
- Swagger documentation
- Docker configuration
- Git hooks for code quality
- Comprehensive documentation

### 🔧 Easy to Extend

- Add new modules following base classes
- Integrate third-party services
- Custom decorators and guards
- Additional authentication strategies
- Database models and relations
- API versioning
- WebSocket support
- Microservices architecture

---

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Git Workflow & Code Quality

This project uses **Husky** to enforce code quality through Git hooks:

- **Pre-commit**: Automatically lints and formats staged files
- **Pre-push**: Runs type-check, tests, and build before pushing
- **Commit-msg**: Validates commit messages follow conventional commits

### Valid Commit Examples:

```bash
git commit -m "feat: add user authentication"
git commit -m "fix: resolve login bug"
git commit -m "docs: update README"
```

📚 **Full documentation**: See [GIT-WORKFLOW-GUIDE.md](./docs/GIT-WORKFLOW-GUIDE.md) and [HUSKY-QUICK-REFERENCE.md](./docs/HUSKY-QUICK-REFERENCE.md)

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
