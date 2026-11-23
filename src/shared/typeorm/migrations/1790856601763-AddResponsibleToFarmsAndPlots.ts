import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResponsibleToFarmsAndPlots1790856601763 implements MigrationInterface {
  name = 'AddResponsibleToFarmsAndPlots1790856601763';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "farms" ADD COLUMN IF NOT EXISTS "responsible_name" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "farms" ADD COLUMN IF NOT EXISTS "responsible_cpf" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "plots" ADD COLUMN IF NOT EXISTS "responsible_name" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "plots" ADD COLUMN IF NOT EXISTS "responsible_cpf" character varying`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "plots" DROP COLUMN IF EXISTS "responsible_cpf"`);
    await queryRunner.query(`ALTER TABLE "plots" DROP COLUMN IF EXISTS "responsible_name"`);
    await queryRunner.query(`ALTER TABLE "farms" DROP COLUMN IF EXISTS "responsible_cpf"`);
    await queryRunner.query(`ALTER TABLE "farms" DROP COLUMN IF EXISTS "responsible_name"`);
  }
}
