import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerPhoneIndex1774200000000 implements MigrationInterface {
    name = 'AddCustomerPhoneIndex1774200000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_orders_customer_phone" ON "orders" ("customer_phone")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX IF EXISTS "IDX_orders_customer_phone"`,
        );
    }
}
