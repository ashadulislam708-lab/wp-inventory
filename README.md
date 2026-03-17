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

## WooCommerce Setup Guide

This project integrates with WooCommerce for bidirectional product/order sync. Follow these steps to connect your WooCommerce store.

### Prerequisites

- WooCommerce 5.0+ installed on your WordPress site
- WordPress admin access
- HTTPS enabled on your WooCommerce store (required for webhooks in production)
- The Glam Lavish backend running and accessible from the internet (for webhook delivery)

### Step 1: Create REST API Credentials in WooCommerce

1. Log in to your WordPress admin panel
2. Navigate to **WooCommerce → Settings → Advanced → REST API**
3. Click **"Add key"**
4. Fill in the fields:
   - **Description**: `Glam Lavish Inventory` (or any descriptive name)
   - **User**: Select your admin user account
   - **Permissions**: **Read/Write**
5. Click **"Generate API key"**
6. Copy both keys immediately:
   - **Consumer Key** (`ck_...`) — you'll need this for `WC_CONSUMER_KEY`
   - **Consumer Secret** (`cs_...`) — you'll need this for `WC_CONSUMER_SECRET`

> **Important:** The Consumer Secret is shown only once. Copy and save it securely before leaving the page.

### Step 2: Configure Environment Variables

Add the following variables to your `backend/.env` file:

```env
# WooCommerce API Configuration
WC_URL=https://your-woocommerce-store.com
WC_CONSUMER_KEY=ck_your_consumer_key_here
WC_CONSUMER_SECRET=cs_your_consumer_secret_here
WC_WEBHOOK_SECRET=your-webhook-secret-here
```

| Variable | Description |
|----------|-------------|
| `WC_URL` | Full URL of your WooCommerce store (e.g., `https://glamlavish.com`) |
| `WC_CONSUMER_KEY` | The `ck_...` key generated in Step 1 |
| `WC_CONSUMER_SECRET` | The `cs_...` secret generated in Step 1 |
| `WC_WEBHOOK_SECRET` | A custom secret string for HMAC-SHA256 webhook verification. Generate a strong random string (e.g., `openssl rand -hex 32`) |

After updating `.env`, restart the backend server to load the new configuration.

### Step 3: Create Webhooks in WooCommerce

Webhooks allow WooCommerce to notify the inventory system in real time when products or orders change.

1. In WordPress admin, navigate to **WooCommerce → Settings → Advanced → Webhooks**
2. Click **"Add webhook"** and create the following 5 webhooks:

#### Product Webhooks (3 webhooks)

| Field | Product Created | Product Updated | Product Deleted |
|-------|----------------|-----------------|-----------------|
| **Name** | Product Created | Product Updated | Product Deleted |
| **Status** | Active | Active | Active |
| **Topic** | Product created | Product updated | Product deleted |
| **Delivery URL** | `https://your-domain.com/api/woocommerce/webhook/product` | Same | Same |
| **Secret** | Your `WC_WEBHOOK_SECRET` value | Same | Same |
| **API Version** | WP REST API Integration v3 | Same | Same |

#### Order Webhooks (2 webhooks)

| Field | Order Created | Order Updated |
|-------|--------------|---------------|
| **Name** | Order Created | Order Updated |
| **Status** | Active | Active |
| **Topic** | Order created | Order updated |
| **Delivery URL** | `https://your-domain.com/api/woocommerce/webhook/order` | Same |
| **Secret** | Your `WC_WEBHOOK_SECRET` value | Same |
| **API Version** | WP REST API Integration v3 | Same |

3. Click **"Save all webhooks"**
4. WooCommerce will send a **ping request** to each webhook URL to verify connectivity. Check your backend logs to confirm all pings were received successfully.

> **Note:** Replace `https://your-domain.com` with the public URL where your backend is hosted. For local development, use a tunnel service like ngrok to expose your local server.

### Step 4: Initial Product Import

Once credentials and webhooks are configured, import your existing WooCommerce products:

**Via API (using curl or Postman):**

```bash
# First, log in to get a JWT token
curl -X POST http://localhost:8040/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "your-password"}'

# Import all products from WooCommerce
curl -X POST http://localhost:8040/api/woocommerce/import/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Via Dashboard:**
Navigate to the Products page and use the **"Sync from WooCommerce"** button to trigger a manual import.

The import fetches products in batches of 100 and creates local records with all product content (name, description, prices, images, categories, variations). Stock quantities start at 0 and should be set manually in the inventory system.

### Step 5: Verify Setup

1. **Check Sync Logs:** View sync history at `GET /api/woocommerce/sync-logs` or on the dashboard Sync Logs page
2. **Test Product Webhook:** Edit a product in WooCommerce and verify the change appears in the inventory system
3. **Test Order Webhook:** Place a test order in WooCommerce and verify it appears in the Orders list
4. **Test Stock Push:** Adjust stock for a product in the inventory system and verify the quantity updates in WooCommerce

### Sync Architecture Reference

| Direction | What Syncs | Trigger |
|-----------|-----------|---------|
| **Inbound** (WC → Inventory) | Product content (name, description, prices, images, categories, variations) | Webhooks + Manual sync |
| **Inbound** (WC → Inventory) | Orders (customer info, line items, shipping) | Webhooks + Manual sync |
| **Outbound** (Inventory → WC) | Stock quantity only | Automatic on stock change |

**Key rules:**
- WooCommerce is the **master for product content** — products are never created or content-edited in the inventory system
- The inventory system is the **master for stock quantities** — local stock always wins
- Stock changes are pushed outbound automatically when adjustments are made
- A 5-second deduplication window prevents infinite sync loops
- An hourly stock reconciliation cron ensures quantities stay in sync

### Troubleshooting

| Issue | Solution |
|-------|----------|
| **Webhook returns 401/403** | Verify `WC_WEBHOOK_SECRET` matches in both `.env` and WooCommerce webhook settings |
| **Webhooks not firing** | Check webhook status is "Active" in WooCommerce. Check WooCommerce → Status → Logs for delivery errors |
| **HMAC signature mismatch** | Ensure the backend is started with `rawBody: true` (configured in `main.ts`). The raw request body is required for accurate HMAC verification |
| **Products not importing** | Verify `WC_URL`, `WC_CONSUMER_KEY`, and `WC_CONSUMER_SECRET` are correct. Test API access: `curl https://your-store.com/wp-json/wc/v3/products -u ck_key:cs_secret` |
| **Stock not syncing to WC** | Check sync logs for outbound errors. Ensure the API key has **Read/Write** permissions |
| **Webhook ping fails** | Ensure your backend is publicly accessible. For local dev, use ngrok: `ngrok http 8040` |
| **Duplicate products after sync** | Products are matched by `wcId` (WooCommerce product ID). Check for duplicate `wcId` values in the database |

### Available Sync Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/woocommerce/import/products` | Import all products from WC | Admin JWT |
| `POST` | `/api/woocommerce/sync/products` | Full product sync (content in, stock out) | Admin JWT |
| `POST` | `/api/woocommerce/sync/orders` | Sync orders from last 30 days | Admin JWT |
| `POST` | `/api/woocommerce/sync/products/:id` | Sync a single product by ID | Admin JWT |
| `GET` | `/api/woocommerce/sync-logs` | View sync history (paginated) | Admin JWT |
| `POST` | `/api/woocommerce/webhook/product` | Product webhook receiver | HMAC-SHA256 |
| `POST` | `/api/woocommerce/webhook/order` | Order webhook receiver | HMAC-SHA256 |

---

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
