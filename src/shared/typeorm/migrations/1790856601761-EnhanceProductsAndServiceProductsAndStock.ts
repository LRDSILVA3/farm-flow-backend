import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceProductsAndServiceProductsAndStock1790856601761 implements MigrationInterface {
  name = 'EnhanceProductsAndServiceProductsAndStock1790856601761';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Enhance products table
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "code" character varying`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "category" character varying NOT NULL DEFAULT 'Outro'`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "unit" character varying NOT NULL DEFAULT 'un'`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "cost_price" numeric(12,2) NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "price" TYPE numeric(12,2) USING price::numeric(12,2)`);
    await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "price" SET DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "quantity" TYPE numeric(12,2) USING quantity::numeric(12,2)`);
    await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "quantity" SET DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "min_stock" numeric(12,2) NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "supplier" character varying`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "status" character varying NOT NULL DEFAULT 'Ativo'`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "description" text`);

    // 2. Create service_products join table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "service_products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "service_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "is_default" boolean NOT NULL DEFAULT false,
        "default_dosage" numeric(10,2) NOT NULL DEFAULT 0,
        "dosage_unit" character varying NOT NULL DEFAULT '',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_service_products" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_service_product" UNIQUE ("service_id", "product_id"),
        CONSTRAINT "FK_service_products_service" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_service_products_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
      )
    `);

    // 3. Create stock_movements table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stock_movements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "product_id" uuid NOT NULL,
        "order_id" uuid,
        "type" character varying NOT NULL,
        "quantity" numeric(12,2) NOT NULL,
        "previous_stock" numeric(12,2) NOT NULL DEFAULT 0,
        "new_stock" numeric(12,2) NOT NULL DEFAULT 0,
        "unit_price" numeric(12,2),
        "document_number" character varying,
        "notes" text,
        "user_id" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stock_movements" PRIMARY KEY ("id"),
        CONSTRAINT "FK_stock_movements_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_stock_movements_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "stock_movements"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service_products"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "description"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "status"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "supplier"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "min_stock"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "cost_price"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "unit"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "category"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "code"`);
  }
}
