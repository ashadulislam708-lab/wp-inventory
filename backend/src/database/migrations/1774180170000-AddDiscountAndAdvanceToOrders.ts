import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiscountAndAdvanceToOrders1774180170000
    implements MigrationInterface
{
    name = 'AddDiscountAndAdvanceToOrders1774180170000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "orders" ADD COLUMN "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0`,
        );
        await queryRunner.query(
            `ALTER TABLE "orders" ADD COLUMN "advance_amount" DECIMAL(10,2) NOT NULL DEFAULT 0`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "orders" DROP COLUMN "advance_amount"`,
        );
        await queryRunner.query(
            `ALTER TABLE "orders" DROP COLUMN "discount_amount"`,
        );
    }
}
