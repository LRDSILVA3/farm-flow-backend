import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResponsibleAndCreatorToOrders1790856601767 implements MigrationInterface {
  name = 'AddResponsibleAndCreatorToOrders1790856601767';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "responsible_id" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "responsible_name" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "creator_name" character varying`
    );
    await queryRunner.query(
      `UPDATE "orders" SET "responsible_id" = "user_id" WHERE "responsible_id" IS NULL AND "user_id" IS NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "creator_name"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "responsible_name"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "responsible_id"`);
  }
}
