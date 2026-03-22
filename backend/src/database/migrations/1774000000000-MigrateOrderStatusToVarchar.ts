import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateOrderStatusToVarchar1774000000000
    implements MigrationInterface
{
    name = 'MigrateOrderStatusToVarchar1774000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Convert column from enum to varchar
        await queryRunner.query(
            `ALTER TABLE "orders" ALTER COLUMN "status" TYPE varchar(50) USING "status"::text`,
        );

        // 2. Update existing status values to new WC-aligned values
        await queryRunner.query(
            `UPDATE "orders" SET "status" = 'PENDING_PAYMENT' WHERE "status" = 'PENDING'`,
        );
        await queryRunner.query(
            `UPDATE "orders" SET "status" = 'ON_HOLD' WHERE "status" = 'CONFIRMED'`,
        );
        await queryRunner.query(
            `UPDATE "orders" SET "status" = 'COMPLETED' WHERE "status" = 'SHIPPED'`,
        );
        await queryRunner.query(
            `UPDATE "orders" SET "status" = 'COMPLETED' WHERE "status" = 'DELIVERED'`,
        );
        await queryRunner.query(
            `UPDATE "orders" SET "status" = 'REFUNDED' WHERE "status" = 'RETURNED'`,
        );

        // 3. Set new default
        await queryRunner.query(
            `ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT'`,
        );

        // 4. Drop old enum type
        await queryRunner.query(
            `DROP TYPE IF EXISTS "public"."order_status_enum"`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Recreate old enum type
        await queryRunner.query(
            `CREATE TYPE "public"."order_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED')`,
        );

        // 2. Reverse data mapping (COMPLETED -> DELIVERED since SHIPPED/DELIVERED both became COMPLETED)
        await queryRunner.query(
            `UPDATE "orders" SET "status" = 'PENDING' WHERE "status" = 'PENDING_PAYMENT'`,
        );
        await queryRunner.query(
            `UPDATE "orders" SET "status" = 'CONFIRMED' WHERE "status" = 'ON_HOLD'`,
        );
        await queryRunner.query(
            `UPDATE "orders" SET "status" = 'DELIVERED' WHERE "status" = 'COMPLETED'`,
        );
        await queryRunner.query(
            `UPDATE "orders" SET "status" = 'RETURNED' WHERE "status" = 'REFUNDED'`,
        );
        await queryRunner.query(
            `UPDATE "orders" SET "status" = 'CANCELLED' WHERE "status" = 'FAILED'`,
        );
        await queryRunner.query(
            `UPDATE "orders" SET "status" = 'PENDING' WHERE "status" = 'DRAFT'`,
        );

        // 3. Convert column back to enum type
        await queryRunner.query(
            `ALTER TABLE "orders" ALTER COLUMN "status" TYPE "public"."order_status_enum" USING "status"::"public"."order_status_enum"`,
        );

        // 4. Restore old default
        await queryRunner.query(
            `ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING'`,
        );
    }
}
