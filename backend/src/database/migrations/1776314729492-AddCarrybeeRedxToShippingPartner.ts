import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCarrybeeRedxToShippingPartner1776314729492
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TYPE "public"."shipping_partner_enum" ADD VALUE IF NOT EXISTS 'CARRYBEE'`,
        );
        await queryRunner.query(
            `ALTER TYPE "public"."shipping_partner_enum" ADD VALUE IF NOT EXISTS 'REDX'`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // PostgreSQL does not support removing individual enum values.
        // To roll back, you would need to recreate the type and update all
        // referencing columns — perform this manually if needed.
        console.warn(
            'Down migration for AddCarrybeeRedxToShippingPartner requires manual steps: ' +
                'recreate shipping_partner_enum without CARRYBEE/REDX values.',
        );
    }
}
