import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCourierTrackingUrlToOrders1776400000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "courier_tracking_url" VARCHAR(500) NULL`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "orders" DROP COLUMN IF EXISTS "courier_tracking_url"`,
        );
    }
}
