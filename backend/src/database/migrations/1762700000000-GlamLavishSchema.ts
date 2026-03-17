import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Glam Lavish - Complete database schema migration.
 *
 * Creates all tables needed for the inventory management system:
 * - categories (WooCommerce-synced product categories)
 * - products (WooCommerce-synced products with local stock management)
 * - product_variations (variable product variations with JSONB attributes)
 * - orders (order management with courier integration)
 * - order_items (order line items with price snapshots)
 * - stock_adjustment_logs (audit trail for stock changes)
 * - sync_logs (WooCommerce sync audit trail)
 * - invoice_counter (singleton for atomic invoice ID generation)
 * - refresh_tokens (JWT refresh token storage)
 *
 * Also updates the users table to match Glam Lavish requirements.
 */
export class GlamLavishSchema1762700000000 implements MigrationInterface {
    name = 'GlamLavishSchema1762700000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ========================
        // ENUM TYPES
        // ========================
        await queryRunner.query(
            `CREATE TYPE "public"."product_type_enum" AS ENUM('SIMPLE', 'VARIABLE')`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."sync_status_enum" AS ENUM('SYNCED', 'PENDING', 'ERROR')`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."order_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED')`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."order_source_enum" AS ENUM('MANUAL', 'WOOCOMMERCE')`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."shipping_zone_enum" AS ENUM('INSIDE_DHAKA', 'DHAKA_SUB_AREA', 'OUTSIDE_DHAKA')`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."shipping_partner_enum" AS ENUM('STEADFAST', 'PATHAO')`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."sync_direction_enum" AS ENUM('INBOUND', 'OUTBOUND')`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."sync_log_status_enum" AS ENUM('SUCCESS', 'FAILED', 'SKIPPED')`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."user_role_enum" AS ENUM('ADMIN', 'STAFF')`,
        );

        // ========================
        // UPDATE USERS TABLE
        // ========================
        // Add name column (if first_name/last_name exist, migrate data)
        const hasFullName = await queryRunner.hasColumn('users', 'full_name');
        const hasFirstName = await queryRunner.hasColumn('users', 'first_name');

        if (!(await queryRunner.hasColumn('users', 'name'))) {
            await queryRunner.query(
                `ALTER TABLE "users" ADD COLUMN "name" character varying(100)`,
            );
        }

        // Migrate existing names if possible
        if (hasFullName) {
            await queryRunner.query(
                `UPDATE "users" SET "name" = COALESCE("full_name", 'User') WHERE "name" IS NULL`,
            );
        } else if (hasFirstName) {
            await queryRunner.query(
                `UPDATE "users" SET "name" = COALESCE(CONCAT("first_name", ' ', "last_name"), 'User') WHERE "name" IS NULL`,
            );
        } else {
            await queryRunner.query(
                `UPDATE "users" SET "name" = 'User' WHERE "name" IS NULL`,
            );
        }

        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL`,
        );

        // Convert role column to new user_role_enum
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "role" TYPE VARCHAR`,
        );
        // Map old numeric roles to new string roles
        await queryRunner.query(
            `UPDATE "users" SET "role" = 'ADMIN' WHERE "role" = '1' OR "role" = 'admin'`,
        );
        await queryRunner.query(
            `UPDATE "users" SET "role" = 'STAFF' WHERE "role" != 'ADMIN'`,
        );

        // Drop old role enum type if exists
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."user_role_enum" USING "role"::"public"."user_role_enum"`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'STAFF'`,
        );

        // Convert is_active to boolean if it's currently an enum
        const isActiveColumn = await queryRunner.query(
            `SELECT data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active'`,
        );
        if (
            isActiveColumn.length > 0 &&
            isActiveColumn[0].data_type === 'USER-DEFINED'
        ) {
            await queryRunner.query(
                `ALTER TABLE "users" ALTER COLUMN "is_active" TYPE VARCHAR`,
            );
            await queryRunner.query(
                `UPDATE "users" SET "is_active" = 'true' WHERE "is_active" = '1' OR "is_active" = 'true'`,
            );
            await queryRunner.query(
                `UPDATE "users" SET "is_active" = 'false' WHERE "is_active" != 'true'`,
            );
            await queryRunner.query(
                `ALTER TABLE "users" ALTER COLUMN "is_active" TYPE boolean USING "is_active"::boolean`,
            );
            await queryRunner.query(
                `ALTER TABLE "users" ALTER COLUMN "is_active" SET DEFAULT true`,
            );
        }

        // ========================
        // CATEGORIES TABLE
        // ========================
        // Drop old categories table if it exists from the starter kit
        const categoriesExist = await queryRunner.hasTable('categories');
        if (categoriesExist) {
            // Check if it has the wc_id column (Glam Lavish schema)
            const hasWcId = await queryRunner.hasColumn('categories', 'wc_id');
            if (!hasWcId) {
                // Old starter kit categories table -- need to recreate
                // First remove any FK references from products
                try {
                    await queryRunner.query(
                        `ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "FK_9a5f6868c96e0069e699f33e124"`,
                    );
                } catch {
                    /* ignore */
                }
                try {
                    await queryRunner.query(
                        `ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "FK_products_category"`,
                    );
                } catch {
                    /* ignore */
                }
                await queryRunner.query(
                    `DROP TABLE IF EXISTS "categories" CASCADE`,
                );
            }
        }

        // Create categories table (if it doesn't exist)
        if (!(await queryRunner.hasTable('categories'))) {
            await queryRunner.query(`
        CREATE TABLE "categories" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "name" character varying(255) NOT NULL,
          "slug" character varying(255) NOT NULL,
          "wc_id" integer NOT NULL,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_categories" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_categories_slug" UNIQUE ("slug"),
          CONSTRAINT "UQ_categories_wc_id" UNIQUE ("wc_id")
        )
      `);
            await queryRunner.query(
                `CREATE INDEX "IDX_categories_slug" ON "categories" ("slug")`,
            );
            await queryRunner.query(
                `CREATE INDEX "IDX_categories_wc_id" ON "categories" ("wc_id")`,
            );
        }

        // ========================
        // PRODUCTS TABLE
        // ========================
        // Drop old products table if it exists from the starter kit
        const productsExist = await queryRunner.hasTable('products');
        if (productsExist) {
            const hasWcIdProducts = await queryRunner.hasColumn(
                'products',
                'wc_id',
            );
            if (!hasWcIdProducts) {
                // Old starter kit products table -- drop and recreate
                await queryRunner.query(
                    `DROP TABLE IF EXISTS "products" CASCADE`,
                );
            }
        }

        if (!(await queryRunner.hasTable('products'))) {
            await queryRunner.query(`
        CREATE TABLE "products" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "name" character varying(255) NOT NULL,
          "short_description" text,
          "description" text,
          "image_url" text,
          "sku" character varying(100),
          "type" "public"."product_type_enum" NOT NULL DEFAULT 'SIMPLE',
          "regular_price" decimal(10,2),
          "sale_price" decimal(10,2),
          "stock_quantity" integer NOT NULL DEFAULT 0,
          "low_stock_threshold" integer NOT NULL DEFAULT 5,
          "wc_id" integer NOT NULL,
          "wc_permalink" text,
          "sync_status" "public"."sync_status_enum" NOT NULL DEFAULT 'SYNCED',
          "wc_last_synced_at" TIMESTAMP,
          "category_id" uuid,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMP,
          CONSTRAINT "PK_products" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_products_wc_id" UNIQUE ("wc_id"),
          CONSTRAINT "FK_products_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL
        )
      `);
            await queryRunner.query(
                `CREATE INDEX "IDX_products_sku" ON "products" ("sku")`,
            );
            await queryRunner.query(
                `CREATE INDEX "IDX_products_wc_id" ON "products" ("wc_id")`,
            );
            await queryRunner.query(
                `CREATE INDEX "IDX_products_sync_status" ON "products" ("sync_status")`,
            );
            await queryRunner.query(
                `CREATE INDEX "IDX_products_deleted_at" ON "products" ("deleted_at")`,
            );
            await queryRunner.query(
                `CREATE INDEX "IDX_products_category_id" ON "products" ("category_id")`,
            );
        }

        // ========================
        // PRODUCT VARIATIONS TABLE
        // ========================
        await queryRunner.query(`
      CREATE TABLE "product_variations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "product_id" uuid NOT NULL,
        "sku" character varying(100),
        "attributes" jsonb NOT NULL DEFAULT '{}',
        "regular_price" decimal(10,2),
        "sale_price" decimal(10,2),
        "stock_quantity" integer NOT NULL DEFAULT 0,
        "image_url" text,
        "wc_id" integer NOT NULL,
        "wc_last_synced_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_variations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_product_variations_wc_id" UNIQUE ("wc_id"),
        CONSTRAINT "FK_product_variations_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
      )
    `);
        await queryRunner.query(
            `CREATE INDEX "IDX_product_variations_wc_id" ON "product_variations" ("wc_id")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_product_variations_product_id" ON "product_variations" ("product_id")`,
        );

        // ========================
        // ORDERS TABLE
        // ========================
        await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "invoice_id" character varying(20) NOT NULL,
        "created_by_id" uuid,
        "source" "public"."order_source_enum" NOT NULL DEFAULT 'MANUAL',
        "status" "public"."order_status_enum" NOT NULL DEFAULT 'PENDING',
        "customer_name" character varying(255) NOT NULL,
        "customer_phone" character varying(20) NOT NULL,
        "customer_address" text NOT NULL,
        "shipping_zone" "public"."shipping_zone_enum" NOT NULL,
        "shipping_partner" "public"."shipping_partner_enum" NOT NULL DEFAULT 'STEADFAST',
        "shipping_fee" decimal(10,2) NOT NULL,
        "subtotal" decimal(10,2) NOT NULL,
        "grand_total" decimal(10,2) NOT NULL,
        "courier_consignment_id" character varying(100),
        "courier_tracking_code" character varying(100),
        "qr_code_data_url" text,
        "wc_order_id" integer,
        "wc_shipping_cost" decimal(10,2),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_orders" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_orders_invoice_id" UNIQUE ("invoice_id"),
        CONSTRAINT "FK_orders_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_orders_wc_order_id" ON "orders" ("wc_order_id") WHERE "wc_order_id" IS NOT NULL`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_orders_invoice_id" ON "orders" ("invoice_id")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_orders_status" ON "orders" ("status")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_orders_source" ON "orders" ("source")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_orders_created_at" ON "orders" ("created_at")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_orders_courier_consignment_id" ON "orders" ("courier_consignment_id")`,
        );

        // ========================
        // ORDER ITEMS TABLE
        // ========================
        await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_id" uuid NOT NULL,
        "product_id" uuid,
        "variation_id" uuid,
        "product_name" character varying(255) NOT NULL,
        "variation_label" character varying(255),
        "quantity" integer NOT NULL,
        "unit_price" decimal(10,2) NOT NULL,
        "total_price" decimal(10,2) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_order_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_items_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_order_items_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_order_items_variation" FOREIGN KEY ("variation_id") REFERENCES "product_variations"("id") ON DELETE SET NULL
      )
    `);
        await queryRunner.query(
            `CREATE INDEX "IDX_order_items_order_id" ON "order_items" ("order_id")`,
        );

        // ========================
        // STOCK ADJUSTMENT LOGS TABLE
        // ========================
        await queryRunner.query(`
      CREATE TABLE "stock_adjustment_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "product_id" uuid NOT NULL,
        "variation_id" uuid,
        "adjusted_by_id" uuid,
        "previous_qty" integer NOT NULL,
        "new_qty" integer NOT NULL,
        "reason" character varying(255) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stock_adjustment_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_stock_adjustment_logs_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_stock_adjustment_logs_variation" FOREIGN KEY ("variation_id") REFERENCES "product_variations"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_stock_adjustment_logs_user" FOREIGN KEY ("adjusted_by_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
        await queryRunner.query(
            `CREATE INDEX "IDX_stock_adjustment_logs_product_created" ON "stock_adjustment_logs" ("product_id", "created_at")`,
        );

        // ========================
        // SYNC LOGS TABLE
        // ========================
        await queryRunner.query(`
      CREATE TABLE "sync_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "direction" "public"."sync_direction_enum" NOT NULL,
        "entity_type" character varying(50) NOT NULL,
        "entity_id" uuid,
        "status" "public"."sync_log_status_enum" NOT NULL,
        "payload" jsonb,
        "error" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sync_logs" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(
            `CREATE INDEX "IDX_sync_logs_entity_type_entity_id" ON "sync_logs" ("entity_type", "entity_id")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_sync_logs_status" ON "sync_logs" ("status")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_sync_logs_created_at" ON "sync_logs" ("created_at")`,
        );

        // ========================
        // INVOICE COUNTER TABLE (SINGLETON)
        // ========================
        await queryRunner.query(`
      CREATE TABLE "invoice_counter" (
        "id" integer NOT NULL DEFAULT 1,
        "last_num" integer NOT NULL DEFAULT 0,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invoice_counter" PRIMARY KEY ("id"),
        CONSTRAINT "CK_invoice_counter_singleton" CHECK ("id" = 1)
      )
    `);
        // Insert the singleton row
        await queryRunner.query(
            `INSERT INTO "invoice_counter" ("id", "last_num") VALUES (1, 0)`,
        );

        // ========================
        // REFRESH TOKENS TABLE
        // ========================
        await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token" character varying(500) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "is_revoked" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
        await queryRunner.query(
            `CREATE INDEX "IDX_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_refresh_tokens_token" ON "refresh_tokens" ("token")`,
        );

        // ========================
        // CLEANUP OLD ENUM TYPES (from starter kit)
        // ========================
        // Drop old enum types if they exist (safe to drop after migration)
        await queryRunner.query(
            `DROP TYPE IF EXISTS "public"."users_role_enum" CASCADE`,
        );
        await queryRunner.query(
            `DROP TYPE IF EXISTS "public"."users_is_active_enum" CASCADE`,
        );
        await queryRunner.query(
            `DROP TYPE IF EXISTS "public"."users_social_login_type_enum" CASCADE`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order of creation (respecting FK constraints)
        await queryRunner.query(
            `DROP TABLE IF EXISTS "refresh_tokens" CASCADE`,
        );
        await queryRunner.query(
            `DROP TABLE IF EXISTS "invoice_counter" CASCADE`,
        );
        await queryRunner.query(`DROP TABLE IF EXISTS "sync_logs" CASCADE`);
        await queryRunner.query(
            `DROP TABLE IF EXISTS "stock_adjustment_logs" CASCADE`,
        );
        await queryRunner.query(`DROP TABLE IF EXISTS "order_items" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "orders" CASCADE`);
        await queryRunner.query(
            `DROP TABLE IF EXISTS "product_variations" CASCADE`,
        );
        await queryRunner.query(`DROP TABLE IF EXISTS "products" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "categories" CASCADE`);

        // Drop enum types
        await queryRunner.query(
            `DROP TYPE IF EXISTS "public"."user_role_enum" CASCADE`,
        );
        await queryRunner.query(
            `DROP TYPE IF EXISTS "public"."sync_log_status_enum" CASCADE`,
        );
        await queryRunner.query(
            `DROP TYPE IF EXISTS "public"."sync_direction_enum" CASCADE`,
        );
        await queryRunner.query(
            `DROP TYPE IF EXISTS "public"."shipping_partner_enum" CASCADE`,
        );
        await queryRunner.query(
            `DROP TYPE IF EXISTS "public"."shipping_zone_enum" CASCADE`,
        );
        await queryRunner.query(
            `DROP TYPE IF EXISTS "public"."order_source_enum" CASCADE`,
        );
        await queryRunner.query(
            `DROP TYPE IF EXISTS "public"."order_status_enum" CASCADE`,
        );
        await queryRunner.query(
            `DROP TYPE IF EXISTS "public"."sync_status_enum" CASCADE`,
        );
        await queryRunner.query(
            `DROP TYPE IF EXISTS "public"."product_type_enum" CASCADE`,
        );
    }
}
