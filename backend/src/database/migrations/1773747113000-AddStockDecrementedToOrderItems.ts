import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStockDecrementedToOrderItems1773747113000
    implements MigrationInterface
{
    name = 'AddStockDecrementedToOrderItems1773747113000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "order_items" ADD "stock_decremented" boolean NOT NULL DEFAULT true`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "order_items" DROP COLUMN "stock_decremented"`,
        );
    }
}
