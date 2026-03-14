# API Reference: glam-lavish

**Last Updated:** 2026-03-15

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Auth](#auth)
  - [Products](#products-read-only-except-stock)
  - [Categories](#categories-read-only)
  - [Orders](#orders)
  - [Users (Admin Only)](#users-admin-only)
  - [Public Tracking](#public-tracking)
  - [WooCommerce Integration](#woocommerce-integration)
  - [Dashboard](#dashboard)
- [Request/Response Examples](#requestresponse-examples)
- [Error Responses](#error-responses)
- [Pagination](#pagination)
- [Enums & Constants](#enums--constants)

---

## Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:8040/api` |
| Production | `https://api.glamlavish.com/api` |

---

## Authentication

- **Method:** JWT Bearer tokens via `Authorization: Bearer <token>` header
- **Access token:** 1-hour expiry
- **Refresh token:** 7-day expiry, stored in the `RefreshToken` database table
- **Public endpoints (no auth required):**
  - `GET /api/tracking/:invoiceId`
  - `POST /api/woocommerce/webhook/*` (verified via webhook signature instead)
- All other endpoints require a valid access token
- Passwords are hashed with bcrypt (minimum 10 salt rounds)
- No self-registration -- admins create all user accounts

---

## Endpoints

### Auth

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login with email/password. Returns access token (1h) + refresh token (7d) | No |
| POST | `/api/auth/refresh` | Exchange valid refresh token for new access + refresh token pair | No (uses refresh token) |
| POST | `/api/auth/logout` | Revoke current refresh token (invalidates session) | Yes |
| GET | `/api/auth/me` | Get current authenticated user profile | Yes |

---

### Products (Read-only except stock)

Products are synced from WooCommerce and managed as read-only records in the inventory system. Only stock-related endpoints are writable. Stock changes are automatically pushed to WooCommerce.

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/products` | List products with filtering and pagination | Yes |
| GET | `/api/products/:id` | Product detail with variations and stock history | Yes |
| PATCH | `/api/products/:id/stock` | Adjust product stock. Pushes updated stock to WooCommerce | Yes |
| PATCH | `/api/products/variations/:id/stock` | Adjust variation stock. Pushes updated stock to WooCommerce | Yes |
| GET | `/api/products/:id/stock-history` | View stock adjustment log for a product | Yes |

#### GET /api/products -- Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 25) |
| `category` | string | Filter by category ID |
| `stockStatus` | string | Filter by stock status (e.g., `LOW`, `OUT_OF_STOCK`, `IN_STOCK`) |
| `search` | string | Search by product name or SKU |

#### PATCH /api/products/:id/stock -- Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `quantity` | number | Yes | Stock adjustment amount (positive to add, negative to subtract) |
| `reason` | string | Yes | Reason for adjustment (e.g., "Physical count adjustment", "Damage") |

#### PATCH /api/products/variations/:id/stock -- Request Body

Same as product stock adjustment above.

---

### Categories (Read-only)

Categories are imported from WooCommerce and used as read-only filters. No local creation or editing.

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/categories` | List all categories (synced from WooCommerce, used for product filtering) | Yes |

---

### Orders

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/orders` | List orders with filtering and pagination | Yes |
| GET | `/api/orders/export` | Export filtered orders as CSV. Same query params as list | Yes |
| GET | `/api/orders/:id` | Order detail with line items | Yes |
| POST | `/api/orders` | Create order with automatic invoice ID, stock decrement, Steadfast push, QR code, and WC stock sync | Yes |
| PATCH | `/api/orders/:id` | Edit order (PENDING/CONFIRMED only). Auto-adjusts stock, re-pushes to Steadfast | Yes |
| PATCH | `/api/orders/:id/status` | Update order status. CANCELLED: stock restore + courier cancel. RETURNED: stock restore | Yes |
| GET | `/api/orders/:id/invoice` | Get invoice print data for thermal receipt (3x4 inch) | Yes |
| GET | `/api/orders/:id/qr` | Get QR code image (data URL) | Yes |
| POST | `/api/orders/:id/retry-courier` | Retry Steadfast courier push for orders where initial push failed (`courierConsignmentId` is null) | Yes |

#### GET /api/orders -- Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 25) |
| `status` | string | Filter by order status (see Order Statuses enum) |
| `source` | string | Filter by order source (e.g., `MANUAL`, `WOOCOMMERCE`) |
| `startDate` | string (ISO 8601) | Filter orders created on or after this date |
| `endDate` | string (ISO 8601) | Filter orders created on or before this date |

#### POST /api/orders -- Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customerName` | string | Yes | Customer full name |
| `customerPhone` | string | Yes | Bangladesh mobile number |
| `customerAddress` | string | Yes | Full delivery address |
| `shippingZone` | string | Yes | One of: `INSIDE_DHAKA`, `DHAKA_SUB_AREA`, `OUTSIDE_DHAKA` |
| `shippingPartner` | string | Yes | One of: `STEADFAST`, `PATHAO` |
| `items` | array | Yes | Array of order line items |
| `items[].productId` | string (UUID) | Yes | Product ID |
| `items[].variationId` | string (UUID) or null | No | Variation ID (null for simple products) |
| `items[].quantity` | number | Yes | Quantity to order (validated against available stock) |

**Order creation flow:**
1. Invoice ID generated atomically (`GL-0001`, `GL-0002`, ...) using row-level locking
2. Stock decremented for each product/variation (blocks if insufficient stock)
3. Order automatically pushed to Steadfast courier API
4. QR code generated linking to public tracking page
5. Stock synced to WooCommerce

#### PATCH /api/orders/:id -- Request Body

Same fields as POST. Only allowed when order status is PENDING or CONFIRMED. When edited:
- Stock is auto-adjusted (old quantities restored, new quantities deducted)
- If already pushed to Steadfast, old consignment is cancelled and a new one is created
- Invoice ID does NOT change

#### PATCH /api/orders/:id/status -- Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes | New status (see Order Statuses enum) |

**Status change side effects:**
- **CANCELLED:** Stock for all items is restored + synced to WC. If order has a Steadfast `consignment_id`, courier consignment is cancelled via API. Stock restorations logged with reason "Order Cancelled".
- **RETURNED:** Stock for all items is restored + synced to WC. Courier consignment is NOT cancelled. Stock restorations logged with reason "Order Returned".

#### POST /api/orders/:id/retry-courier

Retries the Steadfast courier push for an order where the initial push failed (`courierConsignmentId` is null). On success, updates the order with the new `consignment_id` and `tracking_code`.

**Response (200):**
```json
{
  "id": "uuid",
  "invoiceId": "GL-0042",
  "courierConsignmentId": "SF-12345",
  "courierTrackingCode": "227241927"
}
```

**Error (400):** Returns error if the order already has a valid consignment ID.

---

### Users (Admin Only)

No self-registration. Only admins can create and manage user accounts.

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users` | List all users | Yes (Admin) |
| POST | `/api/users` | Create user | Yes (Admin) |
| PATCH | `/api/users/:id` | Update user details / reset password | Yes (Admin) |
| DELETE | `/api/users/:id` | Deactivate user account (soft delete) | Yes (Admin) |

#### POST /api/users -- Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User email address |
| `password` | string | Yes | User password |
| `name` | string | Yes | User display name |
| `role` | string | Yes | One of: `ADMIN`, `STAFF` |

---

### Public Tracking

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/tracking/:invoiceId` | Public order tracking page data | No |

**Response includes:**
- Order status timeline (visual progress: Pending -> Confirmed -> Shipped -> Delivered)
- Invoice ID and order date
- Customer name (partially masked for privacy)
- Courier name and tracking ID
- Link to courier's own tracking page (if available)

---

### WooCommerce Integration

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/woocommerce/webhook/order` | Receive WC order webhook. Creates local order + auto-pushes to Steadfast | Webhook signature (HMAC-SHA256) |
| POST | `/api/woocommerce/webhook/product` | Receive WC product webhook. Create/update content or soft-delete (NOT stock) | Webhook signature (HMAC-SHA256) |
| POST | `/api/woocommerce/import/products` | Import all products from WooCommerce (paginated, 100/page) | Yes (Admin) |
| POST | `/api/woocommerce/sync/products` | Manual full product sync (content from WC, stock pushed to WC) | Yes (Admin) |
| POST | `/api/woocommerce/sync/orders` | Manual full order sync (last 30 days) | Yes (Admin) |
| GET | `/api/woocommerce/sync-logs` | View sync operation history | Yes (Admin) |

**Webhook verification:** All webhooks are verified via `X-WC-Webhook-Signature` header using HMAC-SHA256 with the configured webhook secret.

**Deduplication:** When outbound stock sync triggers a WC `product.updated` webhook back, the system checks `wcLastSyncedAt` timestamp. If the entity was synced within the last 5 seconds, the inbound webhook is skipped. Tracking is per-entity, not global.

**WooCommerce Order Status Mapping (inbound):**

| WC Status | Local OrderStatus |
|-----------|-------------------|
| `pending` | PENDING |
| `on-hold` | PENDING |
| `processing` | PROCESSING |
| `completed` | DELIVERED |
| `cancelled` | CANCELLED |
| `refunded` | RETURNED |
| `failed` | CANCELLED |

**WC Order Shipping Zone Parsing:** When an order arrives via WC webhook, the shipping zone is determined from the WC order's `shipping_lines` data (not parsed from address text). The system reads the WC-assigned shipping cost directly from the payload. If no shipping data is available, defaults to "Outside Dhaka" (150 BDT).

**Category Sync:** Categories do not have a dedicated webhook endpoint. Categories are synced as part of product import and product sync operations — they are extracted from product data during `POST /api/woocommerce/import/products` and `POST /api/woocommerce/sync/products`.

---

### Settings

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/settings/wc-status` | Check WooCommerce connection status (tests API credentials from environment variables) | Yes (Admin) |

**Note:** WooCommerce API credentials (`WC_URL`, `WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET`, `WC_WEBHOOK_SECRET`) are configured via environment variables only and are not editable through the API. The Settings page displays connection status and user management.

---

### Dashboard

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard/stats` | Summary: total orders today, revenue today, pending orders count, failed courier count, sync error count | Yes |
| GET | `/api/dashboard/low-stock` | Products with stock below threshold (default 5) | Yes |
| GET | `/api/dashboard/recent-orders` | Last 10 orders with status badges | Yes |

---

## Request/Response Examples

### POST /api/auth/login

**Request:**
```bash
curl -X POST http://localhost:8040/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@glamlavish.com",
    "password": "securepassword"
  }'
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "admin@glamlavish.com",
    "name": "Admin",
    "role": "ADMIN"
  }
}
```

---

### POST /api/auth/refresh

**Request:**
```bash
curl -X POST http://localhost:8040/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }'
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### POST /api/auth/logout

**Request:**
```bash
curl -X POST http://localhost:8040/api/auth/logout \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }'
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### GET /api/auth/me

**Request:**
```bash
curl http://localhost:8040/api/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "admin@glamlavish.com",
  "name": "Admin",
  "role": "ADMIN"
}
```

---

### GET /api/products

**Request:**
```bash
curl "http://localhost:8040/api/products?page=1&limit=25&category=uuid&search=lipstick" \
  -H "Authorization: Bearer <accessToken>"
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Matte Lipstick",
      "sku": "GL-LIP-001",
      "type": "SIMPLE",
      "imageUrl": "https://glamlavish.com/wp-content/uploads/lipstick.jpg",
      "regularPrice": 1499.00,
      "salePrice": 1299.00,
      "stockQuantity": 45,
      "lowStockThreshold": 5,
      "syncStatus": "SYNCED",
      "category": {
        "id": "uuid",
        "name": "Lipsticks"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 150,
    "totalPages": 6
  }
}
```

---

### GET /api/products/:id

**Request:**
```bash
curl http://localhost:8040/api/products/uuid \
  -H "Authorization: Bearer <accessToken>"
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Matte Lipstick Set",
  "sku": "GL-LIP-SET",
  "type": "VARIABLE",
  "shortDescription": "Premium matte lipstick set",
  "description": "<p>Full description from WooCommerce...</p>",
  "imageUrl": "https://glamlavish.com/wp-content/uploads/lipstick-set.jpg",
  "regularPrice": 2499.00,
  "salePrice": null,
  "stockQuantity": 120,
  "lowStockThreshold": 5,
  "wcId": 456,
  "wcPermalink": "https://glamlavish.com/product/matte-lipstick-set/",
  "syncStatus": "SYNCED",
  "category": {
    "id": "uuid",
    "name": "Lipsticks"
  },
  "variations": [
    {
      "id": "uuid",
      "sku": "GL-LIP-SET-RED-M",
      "attributes": { "Color": "Red", "Size": "Medium" },
      "regularPrice": 2499.00,
      "salePrice": null,
      "stockQuantity": 30,
      "imageUrl": "https://glamlavish.com/wp-content/uploads/lipstick-red.jpg",
      "wcId": 457
    }
  ],
  "stockHistory": [
    {
      "id": "uuid",
      "previousQty": 50,
      "newQty": 45,
      "reason": "Order Created - GL-0042",
      "adjustedBy": "Staff Name",
      "createdAt": "2026-03-15T10:30:00Z"
    }
  ]
}
```

---

### PATCH /api/products/:id/stock

**Request:**
```bash
curl -X PATCH http://localhost:8040/api/products/uuid/stock \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": -5,
    "reason": "Physical count adjustment"
  }'
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Product Name",
  "stockQuantity": 45,
  "previousQuantity": 50,
  "wcSyncStatus": "SYNCED"
}
```

---

### POST /api/orders

**Request:**
```bash
curl -X POST http://localhost:8040/api/orders \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "customerPhone": "01712345678",
    "customerAddress": "House 12, Road 5, Dhanmondi, Dhaka",
    "shippingZone": "INSIDE_DHAKA",
    "shippingPartner": "STEADFAST",
    "items": [
      {
        "productId": "uuid",
        "variationId": null,
        "quantity": 2
      }
    ]
  }'
```

**Response (201):**
```json
{
  "id": "uuid",
  "invoiceId": "GL-0042",
  "status": "PENDING",
  "source": "MANUAL",
  "customerName": "John Doe",
  "customerPhone": "01712345678",
  "customerAddress": "House 12, Road 5, Dhanmondi, Dhaka",
  "shippingZone": "INSIDE_DHAKA",
  "shippingPartner": "STEADFAST",
  "shippingFee": 80.00,
  "subtotal": 2998.00,
  "grandTotal": 3078.00,
  "courierConsignmentId": "SF-12345",
  "courierTrackingCode": "227241927",
  "qrCodeDataUrl": "data:image/png;base64,...",
  "items": [
    {
      "id": "uuid",
      "productId": "uuid",
      "variationId": null,
      "productName": "Matte Lipstick",
      "quantity": 2,
      "unitPrice": 1499.00,
      "totalPrice": 2998.00
    }
  ],
  "createdAt": "2026-03-15T10:30:00Z"
}
```

**Note:** If the Steadfast API call fails, the order is still created but `courierConsignmentId` will be `null`. A "Retry Courier" option will be available in the order detail.

---

### PATCH /api/orders/:id/status

**Request:**
```bash
curl -X PATCH http://localhost:8040/api/orders/uuid/status \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CANCELLED"
  }'
```

**Response (200):**
```json
{
  "id": "uuid",
  "invoiceId": "GL-0042",
  "status": "CANCELLED",
  "stockRestored": true,
  "courierCancelled": true
}
```

---

### GET /api/orders/export

**Request:**
```bash
curl "http://localhost:8040/api/orders/export?status=DELIVERED&startDate=2026-03-01&endDate=2026-03-15" \
  -H "Authorization: Bearer <accessToken>" \
  -o orders.csv
```

**Response:** CSV file download with order data matching the applied filters.

---

### GET /api/orders/:id/invoice

**Request:**
```bash
curl http://localhost:8040/api/orders/uuid/invoice \
  -H "Authorization: Bearer <accessToken>"
```

**Response (200):**
```json
{
  "invoiceId": "GL-0042",
  "date": "2026-03-15T10:30:00Z",
  "courierName": "Steadfast",
  "trackingCode": "227241927",
  "customerName": "John Doe",
  "customerPhone": "01712345678",
  "customerAddress": "House 12, Road 5, Dhanmondi, Dhaka",
  "items": [
    {
      "name": "Matte Lipstick",
      "quantity": 1,
      "price": 1499.00
    }
  ],
  "subtotal": 1499.00,
  "shippingFee": 80.00,
  "grandTotal": 1579.00,
  "dueAmount": 1579.00,
  "qrCodeDataUrl": "data:image/png;base64,..."
}
```

**Note:** `dueAmount` always equals `grandTotal` (full COD, no advance payments or discounts).

---

### GET /api/tracking/:invoiceId

**Request (no auth required):**
```bash
curl http://localhost:8040/api/tracking/GL-0042
```

**Response (200):**
```json
{
  "invoiceId": "GL-0042",
  "orderDate": "2026-03-15T10:30:00Z",
  "customerName": "J*** D**",
  "status": "SHIPPED",
  "statusTimeline": [
    { "status": "PENDING", "timestamp": "2026-03-15T10:30:00Z", "active": true },
    { "status": "CONFIRMED", "timestamp": "2026-03-15T11:00:00Z", "active": true },
    { "status": "SHIPPED", "timestamp": "2026-03-15T14:00:00Z", "active": true },
    { "status": "DELIVERED", "timestamp": null, "active": false }
  ],
  "courierName": "Steadfast",
  "courierTrackingCode": "227241927",
  "courierTrackingUrl": "https://steadfast.com.bd/tracking/227241927"
}
```

---

### POST /api/users

**Request:**
```bash
curl -X POST http://localhost:8040/api/users \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "staff@glamlavish.com",
    "password": "securepassword123",
    "name": "Staff Member",
    "role": "STAFF"
  }'
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "staff@glamlavish.com",
  "name": "Staff Member",
  "role": "STAFF",
  "createdAt": "2026-03-15T10:30:00Z"
}
```

---

### GET /api/dashboard/stats

**Request:**
```bash
curl http://localhost:8040/api/dashboard/stats \
  -H "Authorization: Bearer <accessToken>"
```

**Response (200):**
```json
{
  "totalOrdersToday": 12,
  "revenueToday": 45890.00,
  "pendingOrdersCount": 5,
  "failedCourierCount": 1,
  "syncErrorCount": 0
}
```

---

### GET /api/dashboard/low-stock

**Request:**
```bash
curl http://localhost:8040/api/dashboard/low-stock \
  -H "Authorization: Bearer <accessToken>"
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Matte Lipstick",
      "sku": "GL-LIP-001",
      "stockQuantity": 3,
      "lowStockThreshold": 5
    }
  ]
}
```

---

### GET /api/dashboard/recent-orders

**Request:**
```bash
curl http://localhost:8040/api/dashboard/recent-orders \
  -H "Authorization: Bearer <accessToken>"
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "invoiceId": "GL-0042",
      "customerName": "John Doe",
      "grandTotal": 3078.00,
      "status": "PENDING",
      "source": "MANUAL",
      "createdAt": "2026-03-15T10:30:00Z"
    }
  ]
}
```

---

### POST /api/woocommerce/import/products

**Request:**
```bash
curl -X POST http://localhost:8040/api/woocommerce/import/products \
  -H "Authorization: Bearer <accessToken>"
```

**Response (200):**
```json
{
  "imported": 245,
  "updated": 0,
  "errors": 2,
  "details": [
    { "wcId": 789, "error": "Missing required field: sku" }
  ]
}
```

---

### GET /api/woocommerce/sync-logs

**Request:**
```bash
curl "http://localhost:8040/api/woocommerce/sync-logs?page=1&limit=25" \
  -H "Authorization: Bearer <accessToken>"
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "direction": "OUTBOUND",
      "entityType": "PRODUCT",
      "entityId": "uuid",
      "status": "SUCCESS",
      "payload": { "stock_quantity": 45 },
      "error": null,
      "createdAt": "2026-03-15T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 500,
    "totalPages": 20
  }
}
```

---

## Error Responses

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Insufficient stock for Product X (available: 3, requested: 5)",
  "error": "Bad Request"
}
```

### HTTP Status Codes

| Status Code | Meaning | Common Scenarios |
|-------------|---------|------------------|
| 400 | Bad Request | Validation failed, insufficient stock, invalid input |
| 401 | Unauthorized | Missing or expired JWT token |
| 403 | Forbidden | Insufficient role permissions (e.g., staff accessing admin endpoints) |
| 404 | Not Found | Resource does not exist or has been soft-deleted |
| 409 | Conflict | Duplicate invoice ID (should never occur with row-level locking) |
| 500 | Internal Server Error | Unexpected server error |

### Common Validation Errors (400)

```json
{
  "statusCode": 400,
  "message": [
    "email must be a valid email address",
    "password must be at least 8 characters"
  ],
  "error": "Bad Request"
}
```

### Authentication Error (401)

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### Authorization Error (403)

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

---

## Pagination

All list endpoints return paginated results in a consistent format:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 150,
    "totalPages": 6
  }
}
```

- **Default page size:** 25 items per page
- **Page numbering:** Starts at 1
- **Query parameters:** `?page=1&limit=25`

---

## Enums & Constants

### User Roles

| Role | Permissions |
|------|-------------|
| `ADMIN` | Full access to all features including user management and settings |
| `STAFF` | Orders, products (stock only), invoices. Cannot manage users or settings |

### Order Statuses

| Status | Description | Stock Effect | Courier Effect |
|--------|-------------|--------------|----------------|
| `PENDING` | Order created, awaiting confirmation | Stock decremented | Pushed to Steadfast |
| `CONFIRMED` | Order confirmed and being prepared | -- | -- |
| `PROCESSING` | Order being packed/processed | -- | -- |
| `SHIPPED` | Handed to courier | -- | -- |
| `DELIVERED` | Delivered to customer | -- | -- |
| `CANCELLED` | Order cancelled | Stock restored + synced to WC | Consignment cancelled via API |
| `RETURNED` | Order returned by customer | Stock restored + synced to WC | No action (already delivered/returned) |

**Editable statuses:** Orders can only be edited while in `PENDING` or `CONFIRMED` status. Once an order reaches `PROCESSING` or beyond, it is locked.

### Order Source

| Source | Description |
|--------|-------------|
| `MANUAL` | Created directly in the inventory system by staff |
| `WOOCOMMERCE` | Received via WooCommerce webhook |

### Shipping Zones & Fees

| Zone | Fee (BDT) |
|------|-----------|
| `INSIDE_DHAKA` | 80 |
| `DHAKA_SUB_AREA` | 100 |
| `OUTSIDE_DHAKA` | 150 |

### Shipping Partners

| Partner | Status |
|---------|--------|
| `STEADFAST` | Active (primary) |
| `PATHAO` | Future (Phase 6) |

### Product Types

| Type | Description |
|------|-------------|
| `SIMPLE` | Single product without variations |
| `VARIABLE` | Product with variations (color, size, etc.) |

### Sync Status

| Status | Description |
|--------|-------------|
| `SYNCED` | Successfully synced with WooCommerce |
| `PENDING` | Awaiting sync to WooCommerce |
| `ERROR` | Sync failed (check SyncLog for details) |

### Sync Log Direction

| Direction | Description |
|-----------|-------------|
| `INBOUND` | WooCommerce to inventory system (product content, orders) |
| `OUTBOUND` | Inventory system to WooCommerce (stock quantities only) |

### Invoice ID Format

- Pattern: `GL-XXXX` (e.g., `GL-0001`, `GL-0042`, `GL-10000`)
- Sequential, auto-incremented
- No yearly reset -- increments indefinitely
- Generated atomically using row-level locking (`SELECT ... FOR UPDATE`)

### Payment Model

- **Full COD only** -- all orders are Cash on Delivery
- No discount field, no advance payment, no partial payment
- `dueAmount` always equals `grandTotal` (`subtotal + shippingFee`)
- COD amount sent to Steadfast equals `grandTotal`

---

## External API Dependencies

### Steadfast Courier API

| Operation | Method | URL |
|-----------|--------|-----|
| Create Order | POST | `https://portal.steadfast.com.bd/api/v1/create_order` |
| Cancel Order | POST | `https://portal.steadfast.com.bd/api/v1/cancel_order/{consignment_id}` |

**Authentication:** `Api-Key` and `Secret-Key` headers (stored as environment variables).

### WooCommerce REST API v3

| Operation | Method | URL |
|-----------|--------|-----|
| Get Products | GET | `{WC_URL}/wp-json/wc/v3/products` |
| Update Stock | PUT | `{WC_URL}/wp-json/wc/v3/products/{id}` |
| Update Variation Stock | PUT | `{WC_URL}/wp-json/wc/v3/products/{id}/variations/{vid}` |
| Get Orders | GET | `{WC_URL}/wp-json/wc/v3/orders` |

**Authentication:** Consumer Key and Consumer Secret (OAuth 1.0a).
