import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditFieldsAndTags1762666318556 implements MigrationInterface {
    name = 'AddAuditFieldsAndTags1762666318556';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying(50) NOT NULL, "description" text, "slug" character varying NOT NULL, "color" character varying NOT NULL DEFAULT '#6c757d', "is_active" boolean NOT NULL DEFAULT true, "created_by_id" uuid, "updated_by_id" uuid, CONSTRAINT "UQ_d90243459a697eadb8ad56e9092" UNIQUE ("name"), CONSTRAINT "UQ_b3aa10c29ea4e61a830362bd25a" UNIQUE ("slug"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "feature_tags" ("feature_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_46ae2f50e737f13b72bda1119b2" PRIMARY KEY ("feature_id", "tag_id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_bb24249f35098386706447c931" ON "feature_tags" ("feature_id") `,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_39e1d1d5265afdb5bc3c148bdb" ON "feature_tags" ("tag_id") `,
        );
        await queryRunner.query(`ALTER TABLE "features" DROP COLUMN "tags"`);
        await queryRunner.query(
            `ALTER TABLE "features" DROP COLUMN "category"`,
        );
        await queryRunner.query(`ALTER TABLE "users" ADD "created_by_id" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updated_by_id" uuid`);
        await queryRunner.query(
            `ALTER TABLE "features" ADD "updated_by_id" uuid`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD CONSTRAINT "FK_1bbd34899b8e74ef2a7f3212806" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD CONSTRAINT "FK_80e310e761f458f272c20ea6add" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "tags" ADD CONSTRAINT "FK_f6e2dfaca4aed5f8381e4e7b208" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "tags" ADD CONSTRAINT "FK_e28a966f446a4e3b9cfcb7c4c9b" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "features" ADD CONSTRAINT "FK_8d3bc8b8b1eb2772cd919470810" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "feature_tags" ADD CONSTRAINT "FK_bb24249f35098386706447c9319" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
        );
        await queryRunner.query(
            `ALTER TABLE "feature_tags" ADD CONSTRAINT "FK_39e1d1d5265afdb5bc3c148bdba" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "feature_tags" DROP CONSTRAINT "FK_39e1d1d5265afdb5bc3c148bdba"`,
        );
        await queryRunner.query(
            `ALTER TABLE "feature_tags" DROP CONSTRAINT "FK_bb24249f35098386706447c9319"`,
        );
        await queryRunner.query(
            `ALTER TABLE "features" DROP CONSTRAINT "FK_8d3bc8b8b1eb2772cd919470810"`,
        );
        await queryRunner.query(
            `ALTER TABLE "tags" DROP CONSTRAINT "FK_e28a966f446a4e3b9cfcb7c4c9b"`,
        );
        await queryRunner.query(
            `ALTER TABLE "tags" DROP CONSTRAINT "FK_f6e2dfaca4aed5f8381e4e7b208"`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP CONSTRAINT "FK_80e310e761f458f272c20ea6add"`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP CONSTRAINT "FK_1bbd34899b8e74ef2a7f3212806"`,
        );
        await queryRunner.query(
            `ALTER TABLE "features" DROP COLUMN "updated_by_id"`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "updated_by_id"`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "created_by_id"`,
        );
        await queryRunner.query(
            `ALTER TABLE "features" ADD "category" character varying`,
        );
        await queryRunner.query(`ALTER TABLE "features" ADD "tags" text`);
        await queryRunner.query(
            `DROP INDEX "public"."IDX_39e1d1d5265afdb5bc3c148bdb"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_bb24249f35098386706447c931"`,
        );
        await queryRunner.query(`DROP TABLE "feature_tags"`);
        await queryRunner.query(`DROP TABLE "tags"`);
    }
}
