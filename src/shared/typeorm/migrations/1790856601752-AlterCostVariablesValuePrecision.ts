import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterCostVariablesValuePrecision1790856601752 implements MigrationInterface {
  name = 'AlterCostVariablesValuePrecision1790856601752';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cost_variables" ALTER COLUMN "value" TYPE numeric(16, 6);`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cost_variables" ALTER COLUMN "value" TYPE numeric(12, 6);`
    );
  }
}
