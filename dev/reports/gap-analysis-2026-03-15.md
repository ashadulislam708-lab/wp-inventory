# Gap Analysis Report — Glam Lavish

**Date:** 2026-03-15
**Scope:** All (Backend + Dashboard)

---

## Stack Detection

```
═══════════════════════════════════════════
DETECTED STACKS
─────────────────────────────────────────
  Backend:  NestJS 11.0.1        → backend/
  Web:      React 19 + RR 7.5    → dashboard/
─────────────────────────────────────────
Docs:     .claude-project/ (shared)
HTML Prototypes: NONE
─────────────────────────────────────────
Scope:    all
═══════════════════════════════════════════
```

---

## Executive Summary

| Severity | Backend | Dashboard | Cross-Stack | Total |
|----------|---------|-----------|-------------|-------|
| Critical | 3 | 1 | 1 | **5** |
| High | 3 | 0 | 1 | **4** |
| Medium | 3 | 3 | 0 | **6** |
| Low | 2 | 5 | 0 | **7** |
| **Total** | **11** | **9** | **2** | **22** |

**Overall Backend Completion:** ~80%
**Overall Dashboard Completion:** ~95%

---

## Backend Gaps

### Critical

| # | Gap | File | Details |
|---|-----|------|---------|
| B1 | Stock push to WooCommerce not implemented | `backend/src/modules/products/services/product.service.ts` | Both `adjustProductStock()` and `adjustVariationStock()` have `// TODO: Push stock to WooCommerce (placeholder)`. Stock changes never sync outbound to WC. |
| B2 | WC webhook orders don't decrement stock | `backend/src/modules/woocommerce/services/woocommerce.service.ts` (`createOrderFromWc()`) | Orders imported from WC webhooks do NOT decrement inventory stock, causing stock mismatch. Manual orders DO decrement correctly. |
| B3 | Stock reconciliation not implemented | — | PRD requires hourly cron job where "local stock wins". No scheduled job or manual trigger endpoint exists. |

### High

| # | Gap | File | Details |
|---|-----|------|---------|
| B4 | Invoice module has no controller/service | `backend/src/modules/invoice/` | Only `invoice-counter.entity.ts` exists. Invoice data is served via Orders module — no dedicated invoice endpoints. |
| B5 | Sync module has no controller/service | `backend/src/modules/sync/` | Only `sync-log.entity.ts` exists. No sync management or log viewing endpoints (Settings page calls settings service for logs). |
| B6 | Settings endpoints minimal | `backend/src/modules/settings/` | Only `GET /api/settings/wc-status` exists. Missing admin password reset endpoint and general settings management. |

### Medium

| # | Gap | File | Details |
|---|-----|------|---------|
| B7 | No WC webhook HMAC verification | `backend/src/modules/woocommerce/` | PRD requires HMAC-SHA256 verification via `X-WC-Webhook-Signature`. Not confirmed implemented. |
| B8 | No deduplication for WC sync | `backend/src/modules/woocommerce/` | PRD requires 5-second dedup window via `wcLastSyncedAt`. Implementation needs verification. |
| B9 | Pathao courier integration not started | — | Phase 6 deliverable. No code exists yet. |

### Low

| # | Gap | File | Details |
|---|-----|------|---------|
| B10 | Bulk order CSV import not implemented | — | PRD mentions export (implemented) but import could be useful. |
| B11 | Token cleanup / expired token removal | — | No scheduled job to clean expired refresh tokens from database. |

---

## Dashboard Gaps

### Critical

| # | Gap | File | Details |
|---|-----|------|---------|
| D1 | Edit Order page missing | No file exists | Order detail page has Edit button navigating to `/orders/${id}/edit`, but no EditOrderPage component or route exists. PRD requires editing orders in PENDING/CONFIRMED status. |

### Medium

| # | Gap | File | Details |
|---|-----|------|---------|
| D2 | WC credential configuration not in UI | `dashboard/app/pages/settings/` | Settings page shows WC connection status but provides no way to configure WC API credentials (URL, consumer key/secret). These are env vars only. |
| D3 | Phone number validation too lenient | `dashboard/app/utils/validations/order.ts` | Phone field accepts any format. Should validate Bangladeshi format (01XXXXXXXXX). |
| D4 | Product search results not paginated | `dashboard/app/pages/orders/` | CreateOrderPage search dropdown shows max 10 results with no "load more" option. |

### Low

| # | Gap | File | Details |
|---|-----|------|---------|
| D5 | No loading skeleton for product search | CreateOrderPage | Search results appear without loading indication. |
| D6 | Status transitions hardcoded in frontend | `dashboard/app/pages/orders/` | ALLOWED_TRANSITIONS constant should come from backend API for consistency. |
| D7 | No comment/note system on orders | — | No way to add notes to orders for internal tracking. |
| D8 | Invoice print QR code not configurable | `dashboard/app/pages/orders/` | QR code always shown, no toggle. |
| D9 | Tracking page doesn't show status change source | `dashboard/app/pages/tracking/` | Timeline shows statuses but not who/what triggered the change. |

---

## Cross-Stack Gaps

### Critical

| # | Gap | Details |
|---|-----|---------|
| X1 | Outbound stock sync pipeline completely broken | Frontend stock adjustment → Backend adjusts stock ✓ → Backend pushes to WC ✗ (TODO placeholder). This means ALL stock adjustments stay local and WooCommerce store shows stale quantities. |

### High

| # | Gap | Details |
|---|-----|---------|
| X2 | Edit order route gap | Frontend has Edit button + would navigate to edit page, but (a) no frontend edit page component exists, and (b) backend PUT /api/orders/:id endpoint needs verification for edit capability. |

---

## Module Completion Matrix

| Module | Entity | Controller | Service | DTOs | Status |
|--------|--------|-----------|---------|------|--------|
| Auth | ✅ RefreshToken | ✅ 4 endpoints | ✅ Complete | ✅ | Ready |
| Users | ✅ User | ✅ 5 endpoints | ✅ Complete | ✅ | Ready |
| Products | ✅ Product, ProductVariation | ✅ 7 endpoints | ⚠️ Missing WC push | ✅ | 90% |
| Orders | ✅ Order, OrderItem | ✅ 8 endpoints | ✅ Complete | ✅ | Ready |
| Categories | ✅ Category | ✅ 1 endpoint | ✅ Complete | ✅ | Ready |
| Tracking | — | ✅ 1 endpoint | ✅ Complete | — | Ready |
| WooCommerce | — | ✅ 6 endpoints | ⚠️ Missing outbound + stock deduct | ✅ | 70% |
| Dashboard | — | ✅ 3 endpoints | ✅ Complete | ✅ | Ready |
| Settings | — | ✅ 1 endpoint | ⚠️ Minimal | — | 30% |
| Invoice | ✅ InvoiceCounter | ❌ Missing | ❌ Missing | ❌ | Entity only |
| Sync | ✅ SyncLog | ❌ Missing | ❌ Missing | ❌ | Entity only |

## Dashboard Page Completion Matrix

| Page | Implemented | API Connected | Forms/Validation | Loading/Error | Status |
|------|-----------|--------------|-----------------|---------------|--------|
| Login | ✅ | ✅ | ✅ Zod | ✅ | Complete |
| Dashboard | ✅ | ✅ | — | ✅ | Complete |
| Products List | ✅ | ✅ | — | ✅ | Complete |
| Product Detail | ✅ | ✅ | ✅ Stock form | ✅ | Complete |
| Orders List | ✅ | ✅ | — | ✅ | Complete |
| Create Order | ✅ | ✅ | ✅ Zod | ✅ | Complete |
| Edit Order | ❌ Missing | — | — | — | Not Started |
| Order Detail | ✅ | ✅ | ✅ Status | ✅ | Complete |
| Invoice Print | ✅ | ✅ | — | ✅ | Complete |
| Tracking (Public) | ✅ | ✅ | — | ✅ | Complete |
| Settings | ✅ | ✅ | ✅ User CRUD | ✅ | Complete |

---

## Top 10 Priority Recommendations

1. **[CRITICAL]** Implement WC stock push in `ProductService.adjustProductStock()` and `adjustVariationStock()` — core sync requirement
2. **[CRITICAL]** Add stock deduction in `WooCommerceService.createOrderFromWc()` — prevents inventory mismatch
3. **[CRITICAL]** Create Edit Order page component + route — button already exists, user expects this to work
4. **[CRITICAL]** Implement stock reconciliation cron job — PRD Phase 5 requirement
5. **[CRITICAL]** Complete the outbound stock sync pipeline end-to-end — WC store showing stale stock
6. **[HIGH]** Add WC webhook HMAC-SHA256 signature verification — security requirement
7. **[HIGH]** Expand Settings module with admin password reset and general settings
8. **[HIGH]** Add sync log management endpoints (or verify settings controller covers this)
9. **[MEDIUM]** Validate Bangladeshi phone number format in order creation
10. **[MEDIUM]** Add WC sync deduplication (5-second window check)
