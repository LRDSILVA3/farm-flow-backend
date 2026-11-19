import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddControlsStockToProducts1790856601762 implements MigrationInterface {
  name = 'AddControlsStockToProducts1790856601762';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "controls_stock" boolean NOT NULL DEFAULT false`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "controls_stock"`);
  }
}
