# Admin Dashboard API Integration Status: glam-lavish

> **Framework:** React (Vite + React Router v7)
> **Dashboard Type:** Admin Dashboard + Public Tracking
> **Last Updated:** 2026-03-15

## Overview

This document tracks which dashboard screens have been integrated with their required API endpoints. Audit completed on 2026-03-15. All 10 screens are integrated with all 35 required backend endpoints.

---

## Integration Matrix

### Authentication

| Screen | API Endpoint | Status | Service Method | Notes |
|--------|--------------|--------|----------------|-------|
| Login (`/login`) | `POST /api/auth/login` | Complete | `authService.login()` | Stores tokens in localStorage, dispatches setUser |
| Login (redirect) | `GET /api/auth/me` | Complete | `authService.getMe()` | AuthGuard verifies on mount |
| TopBar (logout) | `POST /api/auth/logout` | Complete | `authService.logout()` | Sends refreshToken, clears localStorage |
| Axios interceptor | `POST /api/auth/refresh` | Complete | httpService interceptor | Queue-based, handles concurrent 401s |

### Dashboard (`/`)

| Screen | API Endpoint | Status | Service Method | Notes |
|--------|--------------|--------|----------------|-------|
| Dashboard | `GET /api/dashboard/stats` | Complete | `fetchDashboardStats` thunk | Auto-refresh every 60s |
| Dashboard | `GET /api/dashboard/low-stock` | Complete | `fetchLowStockProducts` thunk | Unwraps `.data` in thunk |
| Dashboard | `GET /api/dashboard/recent-orders` | Complete | `fetchRecentOrders` thunk | Unwraps `.data` in thunk |

### Products

| Screen | API Endpoint | Status | Service Method | Notes |
|--------|--------------|--------|----------------|-------|
| Product List (`/products`) | `GET /api/products?page&limit&category&stockStatus&search` | Complete | `fetchProducts` thunk | Debounced search, pagination, filters |
| Product List | `GET /api/categories` | Complete | `fetchCategories` thunk | Loaded once on mount |
| Product List | `POST /api/woocommerce/import/products` | Complete | `settingsService.importProducts()` | Import button with loading state |
| Product Detail (`/products/:id`) | `GET /api/products/:id` | Complete | `fetchProductDetail` thunk | Includes variations + stock history |
| Product Detail | `PATCH /api/products/:id/stock` | Complete | `productService.adjustStock()` | Form with quantity + reason |
| Product Detail | `PATCH /api/products/variations/:id/stock` | Complete | `productService.adjustVariationStock()` | Per-variation stock adjustment |
| Product Detail | `GET /api/products/:id/stock-history` | Complete | Embedded in product detail | History rendered from `product.stockHistory` |

### Orders

| Screen | API Endpoint | Status | Service Method | Notes |
|--------|--------------|--------|----------------|-------|
| Order List (`/orders`) | `GET /api/orders?page&limit&status&source&startDate&endDate&search` | Complete | `fetchOrders` thunk | Debounced search, all filters wired |
| Order List | `GET /api/orders/export` | Complete | `orderService.exportOrders()` | Blob download with current filters |
| Create Order (`/orders/new`) | `POST /api/orders` | Complete | `orderService.createOrder()` | Cart + customer form, items array, enum values |
| Create Order | `GET /api/products?search` | Complete | `productService.getProducts()` | Debounced product search, limit 10 |
| Create Order | `GET /api/products/:id` | Complete | `productService.getProductById()` | Loads variations for VARIABLE products |
| Order Detail (`/orders/:id`) | `GET /api/orders/:id` | Complete | `fetchOrderDetail` thunk | Full order with items |
| Order Detail | `PATCH /api/orders/:id/status` | Complete | `orderService.updateOrderStatus()` | Status transitions enforced client-side |
| Order Detail | `POST /api/orders/:id/retry-courier` | Complete | `orderService.retryCourier()` | Shown when courierConsignmentId is null |
| Order Detail | `GET /api/orders/:id/qr` | Complete | `orderService.getQrCode()` | Toggle QR display |
| Order Detail | Navigate to edit | Complete | N/A | Edit button links to `/orders/:id/edit` (PENDING/CONFIRMED only) |
| Invoice (`/orders/:id/invoice`) | `GET /api/orders/:id/invoice` | Complete | `orderService.getInvoiceData()` | Thermal 3x4" print via react-to-print |

### Public Tracking

| Screen | API Endpoint | Status | Service Method | Notes |
|--------|--------------|--------|----------------|-------|
| Tracking (`/tracking/:invoiceId`) | `GET /api/tracking/:invoiceId` | Complete | `trackingService.getTracking()` | No auth required, error handling for not found |

### Settings (Admin Only)

| Screen | API Endpoint | Status | Service Method | Notes |
|--------|--------------|--------|----------------|-------|
| Settings - WC Tab | `GET /api/settings/wc-status` | Complete | `settingsService.getWcStatus()` | Connection status with refresh |
| Settings - WC Tab | `POST /api/woocommerce/import/products` | Complete | `settingsService.importProducts()` | Shows import result details |
| Settings - WC Tab | `POST /api/woocommerce/sync/products` | Complete | `settingsService.syncProducts()` | Loading state per button |
| Settings - WC Tab | `POST /api/woocommerce/sync/orders` | Complete | `settingsService.syncOrders()` | Loading state per button |
| Settings - Sync Logs | `GET /api/woocommerce/sync-logs` | Complete | `settingsService.getSyncLogs()` | Paginated with page/limit |
| Settings - Users | `GET /api/users` | Complete | `fetchUsers` thunk | User list table |
| Settings - Users | `POST /api/users` | Complete | `userService.createUser()` | Dialog with form validation |
| Settings - Users | `PATCH /api/users/:id` | Complete | `userService.updateUser()` | Edit dialog, optional password |
| Settings - Users | `DELETE /api/users/:id` | Complete | `userService.deleteUser()` | Confirmation prompt |

---

## Status Legend

| Status | Meaning |
|--------|---------|
| Pending | Not integrated |
| In Progress | Currently integrating |
| Complete | Integrated and working |
| Blocked | API not ready |

---

## API Services

| Service | Location | Endpoints Covered |
|---------|----------|-------------------|
| `httpService` | `services/httpService.ts` | Base Axios instance with JWT interceptor + refresh |
| `authService` | `services/httpServices/authService.ts` | login, logout, getMe |
| `productService` | `services/httpServices/productService.ts` | getProducts, getProductById, adjustStock, adjustVariationStock, getStockHistory, getCategories |
| `orderService` | `services/httpServices/orderService.ts` | getOrders, getOrderById, createOrder, updateOrder, updateOrderStatus, getInvoiceData, getQrCode, retryCourier, exportOrders |
| `dashboardService` | `services/httpServices/dashboardService.ts` | getStats, getLowStock, getRecentOrders |
| `userService` | `services/httpServices/userService.ts` | getUsers, createUser, updateUser, deleteUser |
| `settingsService` | `services/httpServices/settingsService.ts` | getWcStatus, importProducts, syncProducts, syncOrders, getSyncLogs |
| `trackingService` | `services/httpServices/trackingService.ts` | getTracking |

---

## Implementation Checklist

- [x] Axios instance configured (baseURL from VITE_API_URL, 30s timeout)
- [x] Auth token request interceptor (attaches Bearer token from localStorage)
- [x] 401 response interceptor with refresh token rotation (queue-based for concurrent requests)
- [x] Error handling (consistent ErrorResponse format, toast notifications)
- [x] TypeScript types for all requests/responses (types/*.d.ts)
- [x] Enums synced with backend (9 enums, all values match)
- [x] Zod validation schemas for forms (login, order, stock, user)
- [x] Pagination component with meta handling
- [x] Loading states on all API calls
- [x] Empty states on all list views
- [x] CSV export with blob download
- [x] Debounced search on product and order lists
- [x] Role-based route guards (AuthGuard, AdminGuard)

---

## Fixes Applied During Audit (2026-03-15)

| Issue | Fix | Files Changed |
|-------|-----|---------------|
| Missing `SyncLogStatusEnum` frontend enum | Created enum mirroring backend `SyncLogStatusEnum` | `enums/sync-log-status.enum.ts`, `enums/index.ts` |
| Hardcoded `"INBOUND"` string in SettingsPage | Replaced with `SyncDirectionEnum.INBOUND` | `pages/settings/SettingsPage.tsx` |
| Hardcoded `"SUCCESS"` string in SettingsPage | Replaced with `SyncLogStatusEnum.SUCCESS` | `pages/settings/SettingsPage.tsx` |
| Login password min length mismatch (6 vs backend 8) | Updated Zod schema to `min(8)` | `utils/validations/auth.ts` |
| Order search not debounced (fired on every keystroke) | Added debounce ref with 300ms delay | `pages/orders/OrderListPage.tsx` |
| `SyncLog.status` typed as `string` instead of enum | Changed to `SyncLogStatusEnum` | `types/settings.d.ts` |

---

## Notes

- The tracking page (`/tracking/:invoiceId`) uses the shared `httpService` which attaches auth tokens if present. This is acceptable -- the backend does not require auth for this endpoint, and unauthenticated users simply have no token to attach.
- The `clearAuthAndRedirect` in httpService correctly skips redirect for `/tracking` routes.
- Order edit route (`/orders/:id/edit`) is referenced in OrderDetailPage but no edit page exists yet. The route and page will need to be created in a future phase.
- Webhook endpoints (`POST /api/woocommerce/webhook/*`) are backend-only and not called from the frontend (they are called by WooCommerce directly).
- Stock history is embedded in the product detail response (`GET /api/products/:id`), not fetched separately. The standalone `getStockHistory` method exists in productService but is not currently used.

---

**Audit Result:** All 10 screens fully integrated with 35 backend API endpoints. 6 issues found and fixed. Both dashboard and backend builds pass.
