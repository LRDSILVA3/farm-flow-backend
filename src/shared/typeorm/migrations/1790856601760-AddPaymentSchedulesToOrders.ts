import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentSchedulesToOrders1790856601760 implements MigrationInterface {
  name = 'AddPaymentSchedulesToOrders1790856601760';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_schedules" jsonb DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN IF EXISTS "payment_schedules"`,
    );
  }
}
