import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlotsSamplesAndExecutionFields1790856601759 implements MigrationInterface {
  name = 'AddPlotsSamplesAndExecutionFields1790856601759';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Orders extra columns for plots and samples
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "plots" jsonb DEFAULT '[]'`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "executed_samples" integer DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "total_samples" integer DEFAULT 0`);

    // 2. Service Executions columns for products, quantities, units, plots and splits
    await queryRunner.query(`ALTER TABLE "service_executions" ADD COLUMN IF NOT EXISTS "product_name" character varying`);
    await queryRunner.query(`ALTER TABLE "service_executions" ADD COLUMN IF NOT EXISTS "quantity" numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "service_executions" ADD COLUMN IF NOT EXISTS "unit" character varying(20)`);
    await queryRunner.query(`ALTER TABLE "service_executions" ADD COLUMN IF NOT EXISTS "plot_name" character varying`);
    await queryRunner.query(`ALTER TABLE "service_executions" ADD COLUMN IF NOT EXISTS "samples_executed" integer DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "service_executions" ADD COLUMN IF NOT EXISTS "splits" jsonb DEFAULT '[]'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service_executions" DROP COLUMN IF EXISTS "splits"`);
    await queryRunner.query(`ALTER TABLE "service_executions" DROP COLUMN IF EXISTS "samples_executed"`);
    await queryRunner.query(`ALTER TABLE "service_executions" DROP COLUMN IF EXISTS "plot_name"`);
    await queryRunner.query(`ALTER TABLE "service_executions" DROP COLUMN IF EXISTS "unit"`);
    await queryRunner.query(`ALTER TABLE "service_executions" DROP COLUMN IF EXISTS "quantity"`);
    await queryRunner.query(`ALTER TABLE "service_executions" DROP COLUMN IF EXISTS "product_name"`);

    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "total_samples"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "executed_samples"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "plots"`);
  }
}
