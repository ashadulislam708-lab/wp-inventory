import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFeaturesTable1762661276391 implements MigrationInterface {
    name = 'CreateFeaturesTable1762661276391';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "features" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying(255) NOT NULL, "description" text, "price" numeric(10,2) NOT NULL, "sku" character varying, "stock" integer NOT NULL DEFAULT '0', "is_featured" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "tags" text, "category" character varying, "rating" numeric(2,1) NOT NULL DEFAULT '0', "review_count" integer NOT NULL DEFAULT '0', "brand" character varying, "created_by_id" uuid, CONSTRAINT "UQ_43feec5897f73aec47e187ec72d" UNIQUE ("sku"), CONSTRAINT "PK_5c1e336df2f4a7051e5bf08a941" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "features" ADD CONSTRAINT "FK_112900b46aa94e7c5a2bf1db66d" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "features" DROP CONSTRAINT "FK_112900b46aa94e7c5a2bf1db66d"`,
        );
        await queryRunner.query(`DROP TABLE "features"`);
    }
}
