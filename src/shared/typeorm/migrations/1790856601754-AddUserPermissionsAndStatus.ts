import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPermissionsAndStatus1790856601754 implements MigrationInterface {
  name = 'AddUserPermissionsAndStatus1790856601754';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" character varying`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" character varying NOT NULL DEFAULT 'Ativo'`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "permissions" jsonb`);

    await queryRunner.query(`UPDATE "users" SET "status" = 'Ativo' WHERE "status" IS NULL`);
    await queryRunner.query(
      `UPDATE "users"
       SET "permissions" = '["dashboard","customers","farms","orders","schedule","analysis","financial","reports","settings"]'::jsonb
       WHERE ("role" = 'admin' OR lower(COALESCE("role", '')) = 'administrador')
         AND "permissions" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "permissions"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "status"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "phone"`);
  }
}

