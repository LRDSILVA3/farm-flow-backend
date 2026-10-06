import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderFieldsEquipmentFieldsAndTransactions1790856601753 implements MigrationInterface {
  name = 'AddOrderFieldsEquipmentFieldsAndTransactions1790856601753';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Orders extra columns
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "executions" jsonb DEFAULT '[]'`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "schedules" jsonb DEFAULT '[]'`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payments" jsonb DEFAULT '[]'`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "logs" jsonb DEFAULT '[]'`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "executed_area" numeric(10,2) DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paid_amount" numeric(12,2) DEFAULT 0`);

    // 2. Equipment extra columns
    await queryRunner.query(`ALTER TABLE "equipment" ADD COLUMN IF NOT EXISTS "serial_number" character varying`);
    await queryRunner.query(`ALTER TABLE "equipment" ADD COLUMN IF NOT EXISTS "hourmeter" character varying`);
    await queryRunner.query(`ALTER TABLE "equipment" ADD COLUMN IF NOT EXISTS "year" character varying`);
    await queryRunner.query(`ALTER TABLE "equipment" ADD COLUMN IF NOT EXISTS "notes" character varying`);

    // 3. Service Executions table
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "service_executions" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "order_id" character varying NOT NULL,
      "operator_name" character varying NOT NULL,
      "equipment_name" character varying,
      "area_ha" numeric(10,2) NOT NULL,
      "execution_date" character varying,
      "notes" text,
      "created_at" TIMESTAMP NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
      CONSTRAINT "PK_service_executions_id" PRIMARY KEY ("id")
    )`);

    // 4. Financial Transactions table
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "financial_transactions" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "user_id" character varying,
      "order_id" character varying,
      "client_id" character varying,
      "description" character varying NOT NULL,
      "type" character varying NOT NULL,
      "category" character varying NOT NULL,
      "amount" numeric(12,2) NOT NULL,
      "due_date" character varying,
      "payment_date" character varying,
      "status" character varying NOT NULL DEFAULT 'pending',
      "payment_method" character varying,
      "notes" text,
      "created_at" TIMESTAMP NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
      CONSTRAINT "PK_financial_transactions_id" PRIMARY KEY ("id")
    )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "financial_transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service_executions"`);
    await queryRunner.query(`ALTER TABLE "equipment" DROP COLUMN IF EXISTS "notes"`);
    await queryRunner.query(`ALTER TABLE "equipment" DROP COLUMN IF EXISTS "year"`);
    await queryRunner.query(`ALTER TABLE "equipment" DROP COLUMN IF EXISTS "hourmeter"`);
    await queryRunner.query(`ALTER TABLE "equipment" DROP COLUMN IF EXISTS "serial_number"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "paid_amount"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "executed_area"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "logs"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "payments"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "schedules"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "executions"`);
  }
}
