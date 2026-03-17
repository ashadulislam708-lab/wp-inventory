import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNoteToStockAdjustmentLog1773658459136
    implements MigrationInterface
{
    name = 'AddNoteToStockAdjustmentLog1773658459136';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "stock_adjustment_logs" ADD "note" character varying(500)`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "stock_adjustment_logs" DROP COLUMN "note"`,
        );
    }
}
