# Backend API Implementation Status

**Date:** 2026-03-15
**Build Status:** PASS (tsc --noEmit clean, nest build clean)

## Module Summary

| # | Module | Endpoints | Status |
|---|--------|-----------|--------|
| 1 | Auth | 4 | Complete |
| 2 | Users (Admin) | 5 | Complete |
| 3 | Categories | 1 | Complete |
| 4 | Products | 5 | Complete |
| 5 | Orders | 9 | Complete |
| 6 | Dashboard | 3 | Complete |
| 7 | WooCommerce | 6 | Complete |
| 8 | Tracking (Public) | 1 | Complete |
| 9 | Settings | 1 | Complete |
| **Total** | | **35** | |

## Endpoint Details

### Module 1: Auth (4 endpoints)
- [x] `POST /api/auth/login` - JWT login with email/password, returns access+refresh tokens
- [x] `POST /api/auth/refresh` - Exchange refresh token for new token pair
- [x] `POST /api/auth/logout` - Revoke refresh token
- [x] `GET /api/auth/me` - Get current authenticated user

### Module 2: Users - Admin Only (5 endpoints)
- [x] `GET /api/users` - List all users (admin only, RolesGuard)
- [x] `GET /api/users/:id` - Get user by ID (admin only)
- [x] `POST /api/users` - Create user (admin only)
- [x] `PATCH /api/users/:id` - Update user / reset password (admin only)
- [x] `DELETE /api/users/:id` - Deactivate user (sets isActive=false, NEVER hard delete)

### Module 3: Categories (1 endpoint)
- [x] `GET /api/categories` - List all categories (read-only)

### Module 4: Products (5 endpoints)
- [x] `GET /api/products` - List with pagination, search (name/SKU), category filter, stock status filter
- [x] `GET /api/products/:id` - Product detail with variations
- [x] `PATCH /api/products/:id/stock` - Adjust product stock + log to StockAdjustmentLog
- [x] `PATCH /api/products/variations/:id/stock` - Adjust variation stock + log
- [x] `GET /api/products/:id/stock-history` - Paginated stock adjustment log

### Module 5: Orders (9 endpoints)
- [x] `GET /api/orders` - List with filters (status, source, date range, search), pagination 25/page
- [x] `GET /api/orders/export` - CSV export with same filters
- [x] `GET /api/orders/:id` - Detail with items
- [x] `POST /api/orders` - Create: validate stock, decrement, GL-XXXX invoice (atomic), Steadfast push, QR code
- [x] `PATCH /api/orders/:id` - Edit (PENDING/CONFIRMED only): adjust stock diffs, re-push Steadfast
- [x] `PATCH /api/orders/:id/status` - Update status. CANCELLED: restore stock + cancel courier. RETURNED: restore stock
- [x] `GET /api/orders/:id/invoice` - Invoice data for thermal print
- [x] `GET /api/orders/:id/qr` - QR code data URL
- [x] `POST /api/orders/:id/retry-courier` - Retry failed Steadfast push

### Module 6: Dashboard (3 endpoints)
- [x] `GET /api/dashboard/stats` - Orders today, revenue, pending count, failed courier, sync errors
- [x] `GET /api/dashboard/low-stock` - Products at/below lowStockThreshold
- [x] `GET /api/dashboard/recent-orders` - Last 10 orders

### Module 7: WooCommerce (6 endpoints)
- [x] `POST /api/woocommerce/webhook/product` - WC product webhook (HMAC verified, public)
- [x] `POST /api/woocommerce/webhook/order` - WC order webhook (HMAC verified, public)
- [x] `POST /api/woocommerce/import/products` - Bulk import from WC (admin only)
- [x] `POST /api/woocommerce/sync/products` - Manual full sync (admin only)
- [x] `POST /api/woocommerce/sync/orders` - Manual order sync, last 30 days (admin only)
- [x] `GET /api/woocommerce/sync-logs` - Sync history with pagination/filters (admin only)

### Module 8: Public Tracking (1 endpoint)
- [x] `GET /api/tracking/:invoiceId` - Public, no auth. Masked customer name, status timeline, courier info

### Module 9: Settings (1 endpoint)
- [x] `GET /api/settings/wc-status` - Check WC connection status (admin only)

## Architecture

All modules follow NestJS four-layer architecture:
- **Entity** - TypeORM entities with proper decorators
- **Repository/Service** - Business logic with transactions, stock validation
- **Controller** - Route handling with decorators, no business logic
- **DTOs** - class-validator validated on all endpoints

## Critical Business Rules Implemented

| Rule | Implementation |
|------|---------------|
| Stock NEVER negative | Validated in all stock operations before decrement |
| Invoice ID atomic | SELECT...FOR UPDATE row locking on invoice_counter |
| Soft deletes only | User deactivation via isActive=false, Product soft delete via deletedAt |
| Full COD | dueAmount = grandTotal = subtotal + shippingFee |
| Auto courier push | Steadfast API called on every order creation |
| Status transitions | Validated: PENDING->CONFIRMED->PROCESSING->SHIPPED->DELIVERED, CANCELLED/RETURNED from allowed states |
| WC dedup | 5-second window per entity via wcLastSyncedAt |
| Webhook verification | HMAC-SHA256 via X-WC-Webhook-Signature |

## Files Created/Modified

### New Modules
- `backend/src/modules/categories/` - CategoryModule, CategoryService, CategoryController
- `backend/src/modules/products/` - ProductModule, ProductService, ProductController + DTOs
- `backend/src/modules/orders/` - OrderModule, OrderService, OrderController + DTOs
- `backend/src/modules/dashboard/` - DashboardModule, DashboardService, DashboardController
- `backend/src/modules/woocommerce/` - WooCommerceModule, WooCommerceService, WooCommerceController + DTOs
- `backend/src/modules/tracking/` - TrackingModule, TrackingService, TrackingController
- `backend/src/modules/settings/` - SettingsModule, SettingsController
- `backend/src/infrastructure/courier/` - SteadfastService, CourierModule (global)

### Rewritten Modules
- `backend/src/modules/auth/` - Full JWT auth with refresh tokens
- `backend/src/modules/users/` - Admin-only CRUD with RolesGuard

### Modified Infrastructure
- `backend/src/app.module.ts` - All 9 modules + CourierModule registered
- `backend/src/main.ts` - Glam Lavish specific, clean Swagger setup
- `backend/src/config/env-config.service.ts` - Simplified for Glam Lavish env vars
- `backend/src/core/guards/roles.guard.ts` - Uses UserRoleEnum (string-based)
- `backend/src/core/decorators/roles.decorator.ts` - Accepts UserRoleEnum

### Removed
- `backend/src/modules/otp/` - Unused OTP module removed
- `backend/src/modules/features/` - Unused starter kit feature module removed
- Old auth DTOs (apple-login, social-login, forget-password, etc.)
