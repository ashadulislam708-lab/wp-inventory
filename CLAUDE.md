# Glam Lavish — Inventory Management System

## Project Overview

Glam Lavish is an inventory management system for an e-commerce business, working alongside an existing WooCommerce store. It provides centralized product management, streamlined order processing, automated courier dispatching (Steadfast API), thermal invoice generation (3x4 inch), and real-time stock synchronization with WooCommerce.

- **PRD (Source of Truth):** `PRD.md`
- **Backend**: NestJS (TypeScript) — port 8040
- **Dashboard**: React (TypeScript) + Vite + Tailwind CSS — port 8041 (all pages incl. login + public tracking)
- **Database**: PostgreSQL 16 + TypeORM (UUID PKs, soft deletes)
- **Auth**: JWT (access token 1h, refresh token 7d, bcrypt 10 rounds)
- **Courier**: Steadfast API (primary), Pathao API (future Phase 6)
- **E-commerce**: WooCommerce REST API v3 (bidirectional sync)
- **Currency**: BDT (Bangladesh Taka) only
- **Language**: English only
- **Timezone**: UTC in DB, BST (UTC+6) on frontend

---

## CRITICAL RULES

### 1. DATABASE SAFETY — NO DATA DELETION

> **NEVER delete data from the database. Only read and query.**

- **NEVER** use `DELETE FROM`, `DROP TABLE`, `DROP COLUMN`, or `TRUNCATE` on any table
- **NEVER** write migrations that drop columns or tables containing data
- **NEVER** use TypeORM's `remove()` or `delete()` methods for hard deletes
- **ALWAYS** use soft deletes (`deletedAt` timestamp via `@DeleteDateColumn()`) instead of hard deletes
- **ALWAYS** use `softRemove()` or `softDelete()` in TypeORM for deletion operations
- For data fixes, use `UPDATE` queries only — never delete rows
- Stock quantity must **NEVER** go negative — validate before every decrement
- Invoice counter uses row-level locking (`SELECT ... FOR UPDATE`) — never manually edit `invoice_counter` table
- All database reads should use `SELECT` / `find()` / `findOne()` / `createQueryBuilder()` only

### 2. MANDATORY DOCUMENTATION — READ BEFORE ANY WORK

> **Before starting ANY implementation task, you MUST read ALL of these files first.**

| Document | Path | What It Contains | When to Read |
|----------|------|------------------|--------------|
| **Project Knowledge** | `.claude-project/docs/PROJECT_KNOWLEDGE.md` | Full architecture, tech stack, key decisions, env vars, external services | ALWAYS — before any work |
| **API Reference** | `.claude-project/docs/PROJECT_API.md` | All endpoints, request/response formats, auth rules, enums, pagination | Before any API or endpoint work |
| **Database Schema** | `.claude-project/docs/PROJECT_DATABASE.md` | ERD, all table definitions, constraints, indexes, TypeORM notes | Before any entity, migration, or query work |
| **API Integration** | `.claude-project/docs/PROJECT_API_INTEGRATION.md` | Frontend-API page mapping, routing strategy, Axios config | Before any frontend page or API integration work |
| **Design Guidelines** | `.claude-project/docs/PROJECT_DESIGN_GUIDELINES.md` | Color system, typography, layout, component patterns | Before any UI component work |
| **Auth Flow** | `.claude-project/docs/FRONTEND_AUTH_FLOW.md` | Login flow, token strategy, auto-refresh, route guards, role access | Before any auth or protected route work |

### 3. SOURCE OF TRUTH POLICY

- **WooCommerce** is master for all product **content** (name, description, prices, images, categories, variations)
- **Inventory System** is master for **stock quantities** only
- Products are NEVER created or content-edited in the inventory system — always imported from WooCommerce
- Product content is NEVER pushed from inventory to WooCommerce — only stock quantity is pushed outbound
- Stock changes flow: Inventory System → WooCommerce (outbound only)

### 4. NO SELF-REGISTRATION

- Users cannot create their own accounts — only Admins can create staff accounts
- No forgot password flow — Admin resets passwords via Settings
- No sign-up page exists or should be created

---

## Project Structure

```
glam-lavish/
├── backend/                    # NestJS API (port 8040)
│   └── src/
│       ├── modules/
│       │   ├── auth/           # JWT auth with refresh tokens
│       │   ├── users/          # User management (admin only)
│       │   ├── features/       # Business feature modules
│       │   └── otp/            # OTP module
│       ├── database/           # TypeORM entities & migrations
│       ├── config/             # App configuration
│       ├── core/               # Core module (guards, decorators)
│       ├── shared/             # Shared utilities
│       └── infrastructure/     # Infrastructure concerns
├── dashboard/                  # React — all pages incl. login + public tracking (port 8041)
│   └── app/                    # React Router app
├── .claude/                    # Claude config submodule (skills, agents, guides)
├── .claude-project/            # Project documentation & status tracking
│   ├── docs/                   # ⭐ MANDATORY — read before any work
│   ├── prd/                    # PRD PDF
│   ├── status/                 # Implementation status tracking
│   └── memory/                 # Project decisions & learnings
├── PRD.md                      # Product Requirements Document (source of truth)
├── docker-compose.yml          # PostgreSQL + all services
└── README.md                   # Project readme
```

---

## Database Rules

| Rule | Details |
|------|---------|
| Primary Keys | UUID via `@PrimaryGeneratedColumn('uuid')` |
| Money Fields | `{ type: 'decimal', precision: 10, scale: 2 }` |
| Enums | PostgreSQL enum types |
| Soft Deletes | `@DeleteDateColumn()` on Product — triggered by WC `product.deleted` webhook |
| Timestamps | `@CreateDateColumn()` / `@UpdateDateColumn()` — stored in UTC |
| Variation Attributes | JSONB column: `{ "Color": "Red", "Size": "XL" }` — dynamic, not fixed columns |
| Invoice Counter | Singleton row, atomic increment via `SELECT ... FOR UPDATE` row locking |
| Stock Validation | NEVER allow negative stock — block orders with insufficient stock at API level |
| Deletion | **SOFT DELETE ONLY** — set `deletedAt`, never remove rows |
| Data Fixes | Use `UPDATE` queries only — never `DELETE` rows |

### Core Entities

| Entity | Key Purpose |
|--------|-------------|
| User | Admin/Staff accounts (no self-registration) |
| RefreshToken | JWT refresh tokens (7-day expiry) |
| Category | WC-synced, read-only filters |
| Product | WC content (read-only) + local stock (read-write). Soft delete supported |
| ProductVariation | Dynamic JSONB attributes, per-variation stock |
| StockAdjustmentLog | Audit trail for all stock changes |
| Order | Invoice GL-XXXX, auto courier push, status workflow |
| OrderItem | Line items with price snapshots |
| SyncLog | WC sync audit trail (inbound/outbound) |
| InvoiceCounter | Singleton for atomic invoice ID generation |

---

## Key Business Rules

### Orders
- **Invoice ID**: `GL-XXXX` format, sequential, no yearly reset, atomic generation
- **Full COD only**: No discounts, no advance payments. `dueAmount = grandTotal = subtotal + shippingFee`
- **Auto courier push**: Every order (manual + WC) auto-pushes to Steadfast on creation
- **Editable**: Only in PENDING or CONFIRMED status. PROCESSING and beyond = locked
- **Cancellation**: Restore stock + sync to WC + cancel Steadfast consignment
- **Return**: Restore stock + sync to WC (no courier cancellation)
- **Failed courier**: Order still created, flagged with `courierConsignmentId = null`, retry button shown

### Shipping Zones

| Zone | Fee (BDT) |
|------|-----------|
| Inside Dhaka | 80 |
| Dhaka Sub Area | 100 |
| Outside Dhaka | 150 |

### WooCommerce Sync
- **Inbound**: Product content, orders, categories via webhooks + manual sync
- **Outbound**: Stock quantity ONLY via `PUT /wc/v3/products/{id}`
- **Deduplication**: 5-second window per entity via `wcLastSyncedAt`
- **Stock reconciliation**: Hourly cron, local stock wins
- **Webhook verification**: HMAC-SHA256 via `X-WC-Webhook-Signature`

### Order Status Flow

```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
    ↓         ↓
 CANCELLED  CANCELLED
    ↓
 RETURNED
```

| Status | Stock Effect | Courier Effect |
|--------|-------------|----------------|
| PENDING | Decremented | Pushed to Steadfast |
| CANCELLED | Restored + WC sync | Consignment cancelled |
| RETURNED | Restored + WC sync | No action |

---

## API Patterns

- **Auth**: JWT Bearer token in `Authorization` header
- **Public endpoints** (no auth): `GET /api/tracking/:invoiceId`, `POST /api/woocommerce/webhook/*`
- **Products**: Read-only except `PATCH /api/products/:id/stock` and `PATCH /api/products/variations/:id/stock`
- **Pagination**: All lists use `?page=1&limit=25`, response format: `{ data: [], meta: { page, limit, total, totalPages } }`
- **Validation**: `class-validator` on all endpoints
- **Errors**: Consistent format `{ statusCode, message, error }`
- **Roles**: ADMIN (full access), STAFF (no user management, no settings)

---

## Development Setup

```bash
# Start database + services
docker-compose up -d

# Or run locally
cd backend && npm install && npm run start:dev    # port 8040
cd dashboard && npm install && npm run dev         # port 8041
```

### Environment Variables

**Backend** (`backend/.env`):
- `DATABASE_URL` — PostgreSQL connection string
- `PORT` — Server port (8040)
- `MODE` — DEV or PROD
- `AUTH_JWT_SECRET` — JWT signing secret (min 32 chars)
- `FRONTEND_URL` — Frontend URL for CORS
- `WC_URL`, `WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET`, `WC_WEBHOOK_SECRET` — WooCommerce
- `STEADFAST_API_KEY`, `STEADFAST_SECRET_KEY` — Courier

**Dashboard** (`dashboard/.env`):
- `VITE_API_URL` — Backend API base URL (`http://localhost:8040/api`)

---

## Core BASH Tools (MANDATORY)

**Pattern Search — USE 'rg' ONLY:**
```bash
rg -n "pattern" --glob '!node_modules/*'  # Search with line numbers
rg -l "pattern"                            # List matching files
rg -t ts "pattern"                         # Search TypeScript files
```

**File Finding — USE 'fd' ONLY:**
```bash
fd filename                  # Find by name
fd -e ts                     # Find TypeScript files
fd -H .env                   # Include hidden files
```

**Preview — USE 'bat':**
```bash
bat -n filepath              # With line numbers
bat -r 10:50 file            # Lines 10-50
```

**JSON — USE 'jq':**
```bash
jq '.dependencies | keys[]' package.json
```

---

## Essential Commands

| Category | Command | Purpose |
|----------|---------|---------|
| **Git** | /commit | Commit main project, create PR to dev |
| | /commit-all | Commit all including submodules |
| | /pull | Pull latest from dev |
| **Dev** | /fullstack | Run autonomous dev loops |
| | /fix-ticket | Analyze and fix Notion ticket |
| | /gap-finder | Scan for implementation gaps |
| **Design** | /prd-to-design-prompts | Convert PRD to Aura prompts |
| | /prompts-to-aura | Execute prompts on Aura.build |

---

## Active Agents

| Agent | Location | Trigger Condition |
|-------|----------|-------------------|
| backend-developer | .claude/agents/ | Backend code changes |
| frontend-developer | .claude/agents/ | Frontend code changes |
| database-designer | .claude/agents/ | Schema design needed |
| design-qa-agent | .claude/react/agents/ | UI component work |

---

## Framework Resources

| Framework | Path | Description |
|-----------|------|-------------|
| NestJS | .claude/nestjs/guides/ | 20+ development guides |
| React | .claude/react/docs/ | 22 React guides |

---

## Plan Mode Reference

When planning implementation, ALWAYS consult these resources:

### Frontend Planning (React)
1. `.claude/react/docs/file-organization.md` — Directory structure, naming, imports
2. `.claude/react/docs/best-practices.md` — Coding standards
3. `.claude/react/docs/crud-operations.md` — Service/slice/mutation patterns
4. `.claude/agents/frontend-developer.md` — Full agent spec with quality checklist

### Backend Planning (NestJS)
1. `.claude/nestjs/guides/best-practices.md` — Critical rules, architecture
2. `.claude/nestjs/guides/database-patterns.md` — ORM patterns
3. `.claude/nestjs/guides/routing-and-controllers.md` — Controller patterns
4. `.claude/agents/backend-developer.md` — Full agent spec

### Always Reference
- `.claude-project/docs/PROJECT_KNOWLEDGE.md` — Architecture & tech stack
- `.claude-project/docs/PROJECT_API.md` — API endpoints
- `.claude-project/docs/PROJECT_DATABASE.md` — Database schema & ERD
- `.claude-project/docs/PROJECT_API_INTEGRATION.md` — Frontend-API mapping
- `.claude-project/docs/PROJECT_DESIGN_GUIDELINES.md` — Design system
- `.claude-project/docs/FRONTEND_AUTH_FLOW.md` — Auth flow & route guards
- `PRD.md` — Source of truth for all requirements

---

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
