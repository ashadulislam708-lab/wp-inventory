# Database Schema: glam-lavish

## Overview

- **Database**: PostgreSQL 16
- **ORM**: TypeORM 0.3.27
- **Primary Keys**: UUID (`gen_random_uuid()`)
- **Timestamps**: UTC via `@CreateDateColumn()` / `@UpdateDateColumn()`
- **Soft Deletes**: `@DeleteDateColumn()` on Product entity
- **Migrations**: TypeORM migration files

## Entity Relationship Diagram

```
┌──────────────────────────────────┐              ┌──────────────────────────────────┐
│             users                │              │        refresh_tokens            │
├──────────────────────────────────┤              ├──────────────────────────────────┤
│ 🔑 id (PK)          UUID         │──────1:N─────│ 🔑 id (PK)          UUID         │
│   email             VARCHAR(255) │              │ 🔗 userId (FK)      UUID         │
│   password          VARCHAR(255) │              │   token             VARCHAR(500) │
│   name              VARCHAR(100) │              │   expiresAt         TIMESTAMP    │
│   role              ENUM         │              │   isRevoked         BOOLEAN      │
│   isActive          BOOLEAN      │              │   createdAt         TIMESTAMP    │
│   createdAt         TIMESTAMP    │              └──────────────────────────────────┘
│   updatedAt         TIMESTAMP    │
└──────────────────────────────────┘
         │
         │ 1:N (createdBy)
         ▼
┌──────────────────────────────────┐              ┌──────────────────────────────────┐
│            orders                │              │          order_items             │
├──────────────────────────────────┤              ├──────────────────────────────────┤
│ 🔑 id (PK)          UUID         │──────1:N─────│ 🔑 id (PK)          UUID         │
│   invoiceId         VARCHAR(20)  │              │ 🔗 orderId (FK)     UUID         │
│ 🔗 createdById (FK) UUID         │              │ 🔗 productId (FK)   UUID         │
│   source            ENUM         │              │ 🔗 variationId (FK) UUID (null)  │
│   status            ENUM         │              │   productName       VARCHAR(255) │
│   customerName      VARCHAR(255) │              │   variationLabel    VARCHAR(255) │
│   customerPhone     VARCHAR(20)  │              │   quantity          INTEGER       │
│   customerAddress   TEXT         │              │   unitPrice         DECIMAL(10,2) │
│   shippingZone      ENUM         │              │   totalPrice        DECIMAL(10,2) │
│   shippingPartner   ENUM         │              │   createdAt         TIMESTAMP    │
│   shippingFee       DECIMAL(10,2)│              └──────────────────────────────────┘
│   subtotal          DECIMAL(10,2)│
│   grandTotal        DECIMAL(10,2)│
│   courierConsignmentId VARCHAR   │
│   courierTrackingCode  VARCHAR   │
│   qrCodeDataUrl     TEXT         │
│   wcOrderId         INTEGER      │
│   wcShippingCost    DECIMAL(10,2)│
│   createdAt         TIMESTAMP    │
│   updatedAt         TIMESTAMP    │
└──────────────────────────────────┘

┌──────────────────────────────────┐              ┌──────────────────────────────────┐
│          categories              │              │           products               │
├──────────────────────────────────┤              ├──────────────────────────────────┤
│ 🔑 id (PK)          UUID         │──────1:N─────│ 🔑 id (PK)          UUID         │
│   name              VARCHAR(255) │              │ 🔗 categoryId (FK)  UUID         │
│   slug              VARCHAR(255) │              │   name              VARCHAR(255) │
│   wcId              INTEGER      │              │   shortDescription  TEXT         │
│   createdAt         TIMESTAMP    │              │   description       TEXT         │
│   updatedAt         TIMESTAMP    │              │   sku               VARCHAR(100) │
└──────────────────────────────────┘              │   type              ENUM         │
                                                  │   imageUrl          TEXT         │
                                                  │   regularPrice      DECIMAL(10,2)│
                                                  │   salePrice         DECIMAL(10,2)│
                                                  │   stockQuantity     INTEGER       │
                                                  │   lowStockThreshold INTEGER       │
                                                  │   wcId              INTEGER       │
                                                  │   wcPermalink       TEXT         │
                                                  │   syncStatus        ENUM         │
                                                  │   wcLastSyncedAt    TIMESTAMP    │
                                                  │   createdAt         TIMESTAMP    │
                                                  │   updatedAt         TIMESTAMP    │
                                                  │   deletedAt         TIMESTAMP    │
                                                  └──────────────────────────────────┘
                                                              │
                                                              │ 1:N
                                                              ▼
┌──────────────────────────────────┐              ┌──────────────────────────────────┐
│     stock_adjustment_logs        │              │      product_variations          │
├──────────────────────────────────┤              ├──────────────────────────────────┤
│ 🔑 id (PK)          UUID         │              │ 🔑 id (PK)          UUID         │
│ 🔗 productId (FK)   UUID         │              │ 🔗 productId (FK)   UUID         │
│ 🔗 variationId (FK) UUID (null)  │              │   sku               VARCHAR(100) │
│ 🔗 adjustedById (FK) UUID       │              │   attributes        JSONB        │
│   previousQty       INTEGER       │              │   regularPrice      DECIMAL(10,2)│
│   newQty            INTEGER       │              │   salePrice         DECIMAL(10,2)│
│   reason            VARCHAR(255) │              │   stockQuantity     INTEGER       │
│   createdAt         TIMESTAMP    │              │   imageUrl          TEXT         │
│                                  │              │   wcId              INTEGER       │
└──────────────────────────────────┘              │   wcLastSyncedAt    TIMESTAMP    │
                                                  │   createdAt         TIMESTAMP    │
                                                  │   updatedAt         TIMESTAMP    │
                                                  └──────────────────────────────────┘

┌──────────────────────────────────┐              ┌──────────────────────────────────┐
│          sync_logs               │              │       invoice_counter            │
├──────────────────────────────────┤              ├──────────────────────────────────┤
│ 🔑 id (PK)          UUID         │              │ 🔑 id (PK)          INTEGER (1)  │
│   direction         ENUM         │              │   lastNum           INTEGER       │
│   entityType        VARCHAR(50)  │              │   updatedAt         TIMESTAMP    │
│   entityId          UUID         │              └──────────────────────────────────┘
│   status            ENUM         │              Singleton row. Atomic increment via
│   payload           JSONB        │              SELECT ... FOR UPDATE row locking.
│   error             TEXT         │              Format: GL-{lastNum padded to 4+}
│   createdAt         TIMESTAMP    │
└──────────────────────────────────┘

Legend:
🔑 Primary Key (PK)
🔗 Foreign Key (FK)
──  Relationship line
1:N One-to-Many relationship
```

## Entity Relationships

### One-to-Many (1:N)

| Parent | Child | FK Column | ON DELETE |
|--------|-------|-----------|-----------|
| users | refresh_tokens | userId | CASCADE |
| users | orders | createdById | SET NULL |
| users | stock_adjustment_logs | adjustedById | SET NULL |
| categories | products | categoryId | SET NULL |
| products | product_variations | productId | CASCADE |
| products | stock_adjustment_logs | productId | CASCADE |
| products | order_items | productId | SET NULL |
| product_variations | order_items | variationId | SET NULL |
| orders | order_items | orderId | CASCADE |

## Table Definitions

### users

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| email | VARCHAR(255) | No | - | Unique login email |
| password | VARCHAR(255) | No | - | bcrypt hashed (10 salt rounds) |
| name | VARCHAR(100) | No | - | Display name |
| role | ENUM('ADMIN','STAFF') | No | 'STAFF' | User role |
| isActive | BOOLEAN | No | true | Soft deactivation flag |
| createdAt | TIMESTAMP | No | now() | Creation time (UTC) |
| updatedAt | TIMESTAMP | No | now() | Last update (UTC) |

**Constraints:**
- UNIQUE (email)
- CHECK (role IN ('ADMIN', 'STAFF'))

### refresh_tokens

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| userId | UUID | No | - | FK to users(id) |
| token | VARCHAR(500) | No | - | Refresh token value |
| expiresAt | TIMESTAMP | No | - | Token expiration (7 days from creation) |
| isRevoked | BOOLEAN | No | false | Revoked on logout |
| createdAt | TIMESTAMP | No | now() | Creation time |

**Constraints:**
- FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE

### categories

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| name | VARCHAR(255) | No | - | Category name from WC |
| slug | VARCHAR(255) | No | - | URL slug from WC |
| wcId | INTEGER | No | - | WooCommerce category ID |
| createdAt | TIMESTAMP | No | now() | Creation time |
| updatedAt | TIMESTAMP | No | now() | Last update |

**Constraints:**
- UNIQUE (wcId)
- UNIQUE (slug)

### products

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| categoryId | UUID | Yes | null | FK to categories(id) |
| name | VARCHAR(255) | No | - | Product name (from WC, read-only) |
| shortDescription | TEXT | Yes | null | Short desc (from WC) |
| description | TEXT | Yes | null | Full desc (from WC) |
| sku | VARCHAR(100) | Yes | null | Product SKU (from WC) |
| type | ENUM('SIMPLE','VARIABLE') | No | 'SIMPLE' | Product type |
| imageUrl | TEXT | Yes | null | Featured image URL (from WC) |
| regularPrice | DECIMAL(10,2) | Yes | null | Regular price in BDT |
| salePrice | DECIMAL(10,2) | Yes | null | Sale price in BDT |
| stockQuantity | INTEGER | No | 0 | Current stock (owned by inventory) |
| lowStockThreshold | INTEGER | No | 5 | Alert threshold |
| wcId | INTEGER | No | - | WooCommerce product ID |
| wcPermalink | TEXT | Yes | null | WC admin edit URL |
| syncStatus | ENUM('SYNCED','PENDING','ERROR') | No | 'SYNCED' | WC sync status |
| wcLastSyncedAt | TIMESTAMP | Yes | null | Last outbound sync time (for dedup) |
| createdAt | TIMESTAMP | No | now() | Creation time |
| updatedAt | TIMESTAMP | No | now() | Last update |
| deletedAt | TIMESTAMP | Yes | null | Soft delete (WC product.deleted) |

**Constraints:**
- UNIQUE (wcId)
- FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
- INDEX (sku)
- INDEX (syncStatus)
- INDEX (deletedAt) -- for soft delete filtering

### product_variations

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| productId | UUID | No | - | FK to products(id) |
| sku | VARCHAR(100) | Yes | null | Variation SKU |
| attributes | JSONB | No | '{}' | Dynamic attributes e.g. {"Color":"Red","Size":"XL"} |
| regularPrice | DECIMAL(10,2) | Yes | null | Variation regular price |
| salePrice | DECIMAL(10,2) | Yes | null | Variation sale price |
| stockQuantity | INTEGER | No | 0 | Current stock |
| imageUrl | TEXT | Yes | null | Variation image URL |
| wcId | INTEGER | No | - | WooCommerce variation ID |
| wcLastSyncedAt | TIMESTAMP | Yes | null | Last outbound sync time |
| createdAt | TIMESTAMP | No | now() | Creation time |
| updatedAt | TIMESTAMP | No | now() | Last update |

**Constraints:**
- UNIQUE (wcId)
- FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE

### orders

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| invoiceId | VARCHAR(20) | No | - | Format: GL-XXXX (atomic) |
| createdById | UUID | Yes | null | FK to users(id). Null for WC orders |
| source | ENUM('MANUAL','WOOCOMMERCE') | No | 'MANUAL' | Order origin |
| status | ENUM('PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','RETURNED') | No | 'PENDING' | Current status |
| customerName | VARCHAR(255) | No | - | Customer full name |
| customerPhone | VARCHAR(20) | No | - | Bangladesh mobile number |
| customerAddress | TEXT | No | - | Full delivery address |
| shippingZone | ENUM('INSIDE_DHAKA','DHAKA_SUB_AREA','OUTSIDE_DHAKA') | No | - | Determines shipping fee |
| shippingPartner | ENUM('STEADFAST','PATHAO') | No | 'STEADFAST' | Courier partner |
| shippingFee | DECIMAL(10,2) | No | - | 80/100/150 BDT based on zone |
| subtotal | DECIMAL(10,2) | No | - | Sum of item totals |
| grandTotal | DECIMAL(10,2) | No | - | subtotal + shippingFee |
| courierConsignmentId | VARCHAR(100) | Yes | null | Steadfast consignment ID |
| courierTrackingCode | VARCHAR(100) | Yes | null | Courier tracking code |
| qrCodeDataUrl | TEXT | Yes | null | QR code as data URL |
| wcOrderId | INTEGER | Yes | null | WooCommerce order ID (if from WC) |
| wcShippingCost | DECIMAL(10,2) | Yes | null | WC-provided shipping cost |
| createdAt | TIMESTAMP | No | now() | Creation time |
| updatedAt | TIMESTAMP | No | now() | Last update |

**Constraints:**
- UNIQUE (invoiceId)
- UNIQUE (wcOrderId) WHERE wcOrderId IS NOT NULL
- FOREIGN KEY (createdById) REFERENCES users(id) ON DELETE SET NULL
- INDEX (status)
- INDEX (source)
- INDEX (createdAt)
- INDEX (courierConsignmentId)

### order_items

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| orderId | UUID | No | - | FK to orders(id) |
| productId | UUID | Yes | null | FK to products(id) |
| variationId | UUID | Yes | null | FK to product_variations(id) |
| productName | VARCHAR(255) | No | - | Snapshot of product name |
| variationLabel | VARCHAR(255) | Yes | null | e.g. "Red / XL" |
| quantity | INTEGER | No | - | Order quantity |
| unitPrice | DECIMAL(10,2) | No | - | Price per unit at time of order |
| totalPrice | DECIMAL(10,2) | No | - | quantity x unitPrice |
| createdAt | TIMESTAMP | No | now() | Creation time |

**Constraints:**
- FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
- FOREIGN KEY (productId) REFERENCES products(id) ON DELETE SET NULL
- FOREIGN KEY (variationId) REFERENCES product_variations(id) ON DELETE SET NULL

### stock_adjustment_logs

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| productId | UUID | No | - | FK to products(id) |
| variationId | UUID | Yes | null | FK to product_variations(id) |
| adjustedById | UUID | Yes | null | FK to users(id). Null for system adjustments |
| previousQty | INTEGER | No | - | Stock before adjustment |
| newQty | INTEGER | No | - | Stock after adjustment |
| reason | VARCHAR(255) | No | - | Reason: manual adjustment, order created, order cancelled, order returned, order edited |
| createdAt | TIMESTAMP | No | now() | Adjustment time |

**Constraints:**
- FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
- FOREIGN KEY (variationId) REFERENCES product_variations(id) ON DELETE SET NULL
- FOREIGN KEY (adjustedById) REFERENCES users(id) ON DELETE SET NULL
- INDEX (productId, createdAt)

### sync_logs

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| direction | ENUM('INBOUND','OUTBOUND') | No | - | Sync direction |
| entityType | VARCHAR(50) | No | - | 'product', 'order', 'category' |
| entityId | UUID | Yes | null | Local entity ID |
| status | ENUM('SUCCESS','FAILED','SKIPPED') | No | - | Result |
| payload | JSONB | Yes | null | Request/response payload |
| error | TEXT | Yes | null | Error message if failed |
| createdAt | TIMESTAMP | No | now() | Sync time |

**Constraints:**
- INDEX (entityType, entityId)
- INDEX (status)
- INDEX (createdAt)

### invoice_counter

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | INTEGER | No | 1 | Singleton row (always 1) |
| lastNum | INTEGER | No | 0 | Last used invoice number |
| updatedAt | TIMESTAMP | No | now() | Last update |

**Notes:**
- Singleton table -- only one row (id=1)
- Atomic increment via `SELECT ... FOR UPDATE` row locking
- Invoice format: `GL-` + lastNum padded to minimum 4 digits
- No yearly reset -- increments indefinitely (GL-0001, GL-0002, ..., GL-10000+)

## Indexes

| Table | Columns | Type | Purpose |
|-------|---------|------|---------|
| users | email | UNIQUE | Login lookup |
| categories | wcId | UNIQUE | WC sync matching |
| categories | slug | UNIQUE | URL slug lookup |
| products | wcId | UNIQUE | WC sync matching |
| products | sku | INDEX | SKU search |
| products | syncStatus | INDEX | Sync status filtering |
| products | deletedAt | INDEX | Soft delete filtering |
| product_variations | wcId | UNIQUE | WC sync matching |
| orders | invoiceId | UNIQUE | Invoice lookup |
| orders | status | INDEX | Status filtering |
| orders | source | INDEX | Source filtering |
| orders | createdAt | INDEX | Date range queries |
| orders | wcOrderId | UNIQUE (partial) | WC order matching |
| orders | courierConsignmentId | INDEX | Courier lookup |
| sync_logs | entityType, entityId | INDEX | Entity sync history |
| sync_logs | status | INDEX | Status filtering |
| sync_logs | createdAt | INDEX | Recent sync lookup |
| stock_adjustment_logs | productId, createdAt | INDEX | Stock history |

## TypeORM Implementation Notes

- All entities use UUID primary keys via `@PrimaryGeneratedColumn('uuid')`
- Money fields use `{ type: 'decimal', precision: 10, scale: 2 }`
- Enums stored as PostgreSQL enum types
- Soft delete on Product via `@DeleteDateColumn()` for `deletedAt`
- JSONB column for ProductVariation.attributes: `{ type: 'jsonb', default: {} }`
- Timestamps: `@CreateDateColumn()` / `@UpdateDateColumn()` (stored in UTC)
- Invoice counter: `QueryRunner` with `SELECT lastNum FROM invoice_counter WHERE id = 1 FOR UPDATE`

## Migrations

```bash
# Generate migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

---

**Last Updated:** 2026-03-15
