# Project Knowledge: Glam Lavish

## Overview

Glam Lavish is an inventory management system for an e-commerce business, working alongside an existing WooCommerce store. It provides centralized product management, streamlined order processing, automated courier dispatching via Steadfast API, thermal invoice generation, and real-time stock synchronization with WooCommerce.

## Tech Stack

- **Backend**: NestJS (TypeScript)
- **Frontend**: React (TypeScript) + Vite + Tailwind CSS
- **Database**: PostgreSQL + TypeORM (UUID PKs, soft deletes)
- **Auth**: JWT (email/password, access token 1h, refresh token 7d)
- **Courier**: Steadfast API (primary), Pathao API (future)
- **E-commerce**: WooCommerce REST API v3 (bidirectional sync)

## Architecture

```
glam-lavish/
├── backend/           # NestJS API (port 8040)
├── dashboard/         # React Admin Panel — all pages incl. public tracking (port 8041)
├── .claude/           # Claude configuration & skills
├── .claude-project/   # Project documentation
└── docker-compose.yml # Service orchestration
```

## Goals

1. **Centralized Inventory Control** — Manage all products, stock levels, and variations from a single admin panel
2. **Bidirectional WooCommerce Sync** — Orders and stock changes flow seamlessly between inventory system and WooCommerce
3. **Automated Order Fulfillment** — Orders automatically dispatch to Steadfast courier upon creation
4. **Invoice Generation** — Print thermal receipts (3x4 inch) for each order with QR-based tracking
5. **Real-time Order Tracking** — Customers can scan a QR code to track their order status

## User Types

| Role | Permissions |
|------|-------------|
| Admin (Business Owner) | Full access to all features. Manages staff accounts, views dashboard, configures WooCommerce and courier API settings |
| Staff (Order Processor) | Creates/edits orders (before PROCESSING), updates order statuses, prints invoices, views/adjusts product stock. Cannot manage users or system settings |
| Customer (End User) | No login. Scans QR code on invoice to track order status via public tracking page |

## Key Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| WooCommerce as product content master | Eliminates duplicate data entry — staff create/edit products in WooCommerce as they already do. Inventory system only manages stock | 2026-03-15 |
| Inventory system owns stock | Prevents sync conflicts — single source of truth for stock quantities | 2026-03-15 |
| Full COD only | No discount, advance payment, or partial payment. Simplifies order flow | 2026-03-15 |
| No self-registration | Admin creates all accounts. No password reset flow — admin resets passwords | 2026-03-15 |
| JWT with refresh tokens | Access token 1h, refresh token 7d. Silent auto-refresh for seamless UX | 2026-03-15 |
| Invoice IDs: GL-XXXX format | Sequential, atomic generation with row-level locking. No yearly reset | 2026-03-15 |
| No automated courier status polling | Staff manually updates order status. Reduces API calls and complexity | 2026-03-15 |
| Soft delete on products | WC product.deleted webhook sets deletedAt. Preserves order history references | 2026-03-15 |
| Dynamic variation attributes (JSONB) | Stores all WC attributes regardless of what the store defines | 2026-03-15 |
| WC credentials are env-only | WC API keys configured via environment variables, not stored in DB. Settings page shows connection status only — more secure, simpler | 2026-03-15 |
| Categories sync via product import | No dedicated category webhook. Categories extracted during product import/sync operations | 2026-03-15 |

## Background Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Stock Reconciliation | Every hour | Compares local stock vs WooCommerce stock for all products. If mismatch detected, local stock wins — pushed to WC. Discrepancies logged in `SyncLog` for admin review. Prevents silent stock drift from network failures or missed webhooks |

## Development Setup

```bash
# Clone with submodules
git clone --recurse-submodules git@github.com:ashadulislam708-lab/glam-lavish.git
cd "Glam Lavish"

# Start services
docker-compose up -d

# Or run locally
cd backend && npm install && npm run start:dev
cd dashboard && npm install && npm run dev  # port 8041
```

## Environment Variables

### Backend (.env)

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - | `postgresql://postgres:postgres@localhost:5432/glam_lavish` |
| `PORT` | Backend server port | Yes | `8040` | `8040` |
| `MODE` | Environment mode | Yes | `DEV` | `DEV`, `PROD` |
| `AUTH_JWT_SECRET` | JWT signing secret (min 32 chars) | Yes | - | `your-secure-secret-key-min-32-chars` |
| `AUTH_TOKEN_EXPIRE_TIME` | Access token expiration | No | `1h` | `1h` |
| `AUTH_REFRESH_TOKEN_EXPIRE_TIME` | Refresh token expiration | No | `7d` | `7d` |
| `FRONTEND_URL` | Frontend URL for CORS | Yes | `http://localhost:8041` | `http://localhost:8041` |
| `WC_URL` | WooCommerce store URL | Yes | - | `https://glamlavish.com` |
| `WC_CONSUMER_KEY` | WC REST API consumer key | Yes | - | `ck_xxxxx` |
| `WC_CONSUMER_SECRET` | WC REST API consumer secret | Yes | - | `cs_xxxxx` |
| `WC_WEBHOOK_SECRET` | WC webhook signature secret | Yes | - | `your-webhook-secret` |
| `STEADFAST_API_KEY` | Steadfast courier API key | Yes | - | `your-api-key` |
| `STEADFAST_SECRET_KEY` | Steadfast courier secret key | Yes | - | `your-secret-key` |

### Dashboard (.env)

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `VITE_API_URL` | Backend API base URL | Yes | `http://localhost:8040/api` | `http://localhost:8040/api` |

## External Services

| Service | Purpose | Documentation |
|---------|---------|---------------|
| WooCommerce REST API v3 | Product content import, order webhooks, stock sync | https://woocommerce.github.io/woocommerce-rest-api-docs/ |
| Steadfast Courier API | Auto-push orders, status checks, return requests | Base: `https://portal.packzy.com/api/v1` — Full ref: `.claude-project/docs/STEADFAST_API.md` |
| Pathao Courier API (future) | Alternative courier integration (Phase 6) | https://merchant.pathao.com/api-docs |

## Source of Truth Policy

- **WooCommerce** is master for all product content data (name, description, prices, images, categories, variations)
- **Inventory System** is master for stock quantities
- Products are never created or content-edited in the inventory system — always imported from WooCommerce
- Stock changes flow: Inventory -> WooCommerce (outbound only)

## Delivery Phases

| Phase | Duration | Key Deliverables |
|-------|----------|-----------------|
| 1: Scaffolding | Day 1-2 | Project setup, DB schema, auth with refresh tokens, user management |
| 2: Products + WC Import | Day 3-4 | WC product import, product list/detail, categories, stock adjustment |
| 3: Orders + Steadfast | Day 5-8 | Order CRUD, auto Steadfast push, QR code, order editing, cancellation/return |
| 4: Invoice + Tracking | Day 9-10 | Thermal invoice print (3x4"), public tracking page |
| 5: WooCommerce Sync | Day 11-13 | Webhooks, status mapping, stock push, dedup, manual sync, sync logs |
| 6: Dashboard + Polish | Day 14-16 | Dashboard widgets, stock reconciliation cron, Pathao, UX polish |

---

**Last Updated:** 2026-03-15
