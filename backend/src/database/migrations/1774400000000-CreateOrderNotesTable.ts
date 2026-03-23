import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrderNotesTable1774400000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "order_notes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "order_id" uuid NOT NULL,
                "content" text NOT NULL,
                "created_by_id" uuid,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_order_notes" PRIMARY KEY ("id"),
                CONSTRAINT "FK_order_notes_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_order_notes_user" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "order_notes"`);
    }
}
