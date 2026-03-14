import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUsersTable1762192832397 implements MigrationInterface {
    name = 'UpdateUsersTable1762192832397';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "products" DROP CONSTRAINT "FK_products_category"`,
        );
        await queryRunner.query(`DROP INDEX "public"."IDX_users_email"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_role"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_is_active"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_categories_slug"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_categories_name"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_products_name"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_products_slug"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_products_price"`);
        await queryRunner.query(
            `DROP INDEX "public"."IDX_products_is_featured"`,
        );
        await queryRunner.query(`DROP INDEX "public"."IDX_products_is_active"`);
        await queryRunner.query(
            `DROP INDEX "public"."IDX_products_category_id"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_products_stock_quantity"`,
        );
        await queryRunner.query(
            `CREATE TABLE "otp" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "otp" integer NOT NULL, "expires_at" TIMESTAMP, CONSTRAINT "UQ_463cf01e0ea83ad57391fd4e1d7" UNIQUE ("email"), CONSTRAINT "PK_32556d9d7b22031d7d0e1fd6723" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD "full_name" character varying`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."users_social_login_type_enum" AS ENUM('1', '2', '3', '4')`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD "social_login_type" "public"."users_social_login_type_enum"`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD "is_verified" boolean NOT NULL DEFAULT false`,
        );
        await queryRunner.query(`ALTER TABLE "users" ADD "image" text`);
        await queryRunner.query(
            `ALTER TABLE "users" ADD "device_fcm_tokens" jsonb DEFAULT '[]'`,
        );
        await queryRunner.query(`ALTER TABLE "users" ADD "refresh_token" text`);
        await queryRunner.query(
            `ALTER TABLE "users" ADD "remember_me" boolean DEFAULT false`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now()`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT now()`,
        );
        // Convert role enum with proper data migration
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "role" TYPE VARCHAR`,
        );
        await queryRunner.query(
            `UPDATE "users" SET "role" = '3' WHERE "role" = 'super-admin'`,
        );
        await queryRunner.query(
            `UPDATE "users" SET "role" = '1' WHERE "role" = 'admin'`,
        );
        await queryRunner.query(
            `UPDATE "users" SET "role" = '2' WHERE "role" = 'user'`,
        );
        await queryRunner.query(
            `ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."users_role_enum" AS ENUM('1', '2', '3')`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"public"."users_role_enum"`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT '2'`,
        );
        await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);

        // Convert is_active enum with proper data migration
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "is_active" TYPE VARCHAR`,
        );
        await queryRunner.query(
            `UPDATE "users" SET "is_active" = '1' WHERE "is_active" = 'active' OR "is_active" = '1'`,
        );
        await queryRunner.query(
            `UPDATE "users" SET "is_active" = '2' WHERE "is_active" = 'inactive' OR "is_active" = '2'`,
        );
        await queryRunner.query(
            `UPDATE "users" SET "is_active" = '3' WHERE "is_active" = 'deleted' OR "is_active" = '3'`,
        );
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_active"`);
        await queryRunner.query(
            `CREATE TYPE "public"."users_is_active_enum" AS ENUM('1', '2', '3')`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD "is_active" "public"."users_is_active_enum" NOT NULL DEFAULT '1'`,
        );
        await queryRunner.query(
            `ALTER TABLE "categories" ALTER COLUMN "created_at" SET DEFAULT now()`,
        );
        await queryRunner.query(
            `ALTER TABLE "categories" ALTER COLUMN "updated_at" SET DEFAULT now()`,
        );
        await queryRunner.query(
            `ALTER TABLE "products" ALTER COLUMN "created_at" SET DEFAULT now()`,
        );
        await queryRunner.query(
            `ALTER TABLE "products" ALTER COLUMN "updated_at" SET DEFAULT now()`,
        );
        await queryRunner.query(
            `ALTER TABLE "products" ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "products" DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"`,
        );
        await queryRunner.query(
            `ALTER TABLE "products" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
        );
        await queryRunner.query(
            `ALTER TABLE "products" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
        );
        await queryRunner.query(
            `ALTER TABLE "categories" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
        );
        await queryRunner.query(
            `ALTER TABLE "categories" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
        );
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_active"`);
        await queryRunner.query(`DROP TYPE "public"."users_is_active_enum"`);
        await queryRunner.query(
            `ALTER TABLE "users" ADD "is_active" boolean NOT NULL DEFAULT true`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."users_role_enum_old" AS ENUM('admin', 'user', 'moderator')`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum_old" USING "role"::"text"::"public"."users_role_enum_old"`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'`,
        );
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(
            `ALTER TYPE "public"."users_role_enum_old" RENAME TO "users_role_enum"`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "remember_me"`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "refresh_token"`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "device_fcm_tokens"`,
        );
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "image"`);
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "is_verified"`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "social_login_type"`,
        );
        await queryRunner.query(
            `DROP TYPE "public"."users_social_login_type_enum"`,
        );
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "full_name"`);
        await queryRunner.query(`DROP TABLE "otp"`);
        await queryRunner.query(
            `CREATE INDEX "IDX_products_stock_quantity" ON "products" ("stock_quantity") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_products_category_id" ON "products" ("category_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_products_is_active" ON "products" ("is_active") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_products_is_featured" ON "products" ("is_featured") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_products_price" ON "products" ("price") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_products_slug" ON "products" ("slug") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_products_name" ON "products" ("name") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_categories_name" ON "categories" ("name") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_categories_slug" ON "categories" ("slug") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_users_is_active" ON "users" ("is_active") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_users_role" ON "users" ("role") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_users_email" ON "users" ("email") `,
        );
        await queryRunner.query(
            `ALTER TABLE "products" ADD CONSTRAINT "FK_products_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
    }
}
