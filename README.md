# glam-lavish

> Inventory management system for Glam Lavish e-commerce business, working alongside an existing WooCommerce store. Provides centralized product management, streamlined order processing, automated Steadfast courier dispatching, thermal invoice generation, and real-time stock synchronization.

## Features

- Centralized Inventory Control — Manage all products, stock levels, and variations from a single admin panel
- Bidirectional WooCommerce Sync — Orders and stock changes flow seamlessly between inventory system and WooCommerce
- Automated Order Fulfillment — Orders automatically dispatch to Steadfast courier upon creation
- Invoice Generation — Print thermal receipts (3x4 inch) for each order with QR-based tracking
- Real-time Order Tracking — Customers can scan a QR code to track their order status

## Tech Stack

- **Backend**: NestJS (TypeScript)
- **Frontend**: React (TypeScript) + Vite + Tailwind CSS
- **Database**: PostgreSQL + TypeORM
- **Deployment**: Docker

## Architecture

```
glam-lavish/
├── backend/              # NestJS API server
├── dashboard/            # React Admin Panel (login, admin operations, public tracking)
├── .claude/              # Claude configuration & skills
├── .claude-project/      # Project documentation
└── docker-compose.yml    # Service orchestration
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)

### Installation

```bash
# Clone repository with submodules
git clone --recurse-submodules git@github.com:ashadulislam708-lab/glam-lavish.git
cd "Glam Lavish"

# Start all services
docker-compose up -d

# Check service status
docker-compose ps
```

### Service URLs

- **Backend API**: http://localhost:8040
- **Dashboard**: http://localhost:8041

## Development

### Backend Development

```bash
cd backend
npm install
npm run start:dev
```

### Dashboard Development

```bash
cd dashboard
npm install
npm run dev
```

### Database Migrations

```bash
cd backend
npm run migration:generate -- MigrationName
npm run migration:run
```

## Documentation

- **Quick Reference**: See [CLAUDE.md](CLAUDE.md) for Claude context
- **Full Documentation**: See `.claude-project/docs/`
  - [PROJECT_KNOWLEDGE.md](.claude-project/docs/PROJECT_KNOWLEDGE.md) - Architecture
  - [PROJECT_API.md](.claude-project/docs/PROJECT_API.md) - API specs
  - [PROJECT_DATABASE.md](.claude-project/docs/PROJECT_DATABASE.md) - Database schema

## Project Structure

```
backend/
├── src/
│   ├── modules/         # Feature modules
│   ├── entities/        # TypeORM entities
│   ├── dto/             # Data transfer objects
│   └── guards/          # Auth guards
└── test/                # E2E tests
```

```
dashboard/
├── app/
│   ├── components/      # Reusable components
│   ├── routes/          # Page routes
│   ├── services/        # API services
│   └── types/           # TypeScript types
└── public/              # Static assets
```

## Testing

```bash
cd backend
npm run test              # Unit tests
npm run test:e2e          # E2E tests
npm run test:cov          # Coverage report
```

## Deployment

### Production Build

```bash
# Build all services
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

## Contributing

1. Create feature branch from `dev`
2. Make changes and commit
3. Push and create PR to `dev`
4. After review, merge to `dev`
5. `dev` → `main` for production releases

## License

[Specify license]

---

**Generated:** 2026-03-15
