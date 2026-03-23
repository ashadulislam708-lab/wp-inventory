import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusHistoryToOrders1774300000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "orders" ADD COLUMN "status_history" jsonb NOT NULL DEFAULT '[]'`,
        );

        // Backfill existing orders: set statusHistory to [current status]
        await queryRunner.query(
            `UPDATE "orders" SET "status_history" = jsonb_build_array("status")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "orders" DROP COLUMN "status_history"`,
        );
    }
}
