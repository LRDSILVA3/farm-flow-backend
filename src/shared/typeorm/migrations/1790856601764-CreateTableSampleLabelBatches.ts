import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableSampleLabelBatches1790856601764 implements MigrationInterface {
  name = 'CreateTableSampleLabelBatches1790856601764';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sample_label_batches" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "farm_id" character varying,
        "plot_id" character varying,
        "order_id" character varying,
        "user_id" character varying,
        "user_name" character varying,
        "client_name" character varying,
        "farm_name" character varying,
        "plot_name" character varying,
        "responsible_name" character varying,
        "responsible_cpf" character varying,
        "sender" character varying,
        "hectares" character varying,
        "lot" character varying,
        "registration" character varying,
        "city_state" character varying,
        "total_samples_count" integer NOT NULL DEFAULT 0,
        "emitted_count" integer NOT NULL DEFAULT 0,
        "pending_count" integer NOT NULL DEFAULT 0,
        "samples" jsonb DEFAULT '[]',
        "pending_samples" jsonb DEFAULT '[]',
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sample_label_batches_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sample_label_batches_created_at" ON "sample_label_batches" ("created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sample_label_batches_farm_plot" ON "sample_label_batches" ("farm_id", "plot_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sample_label_batches_order" ON "sample_label_batches" ("order_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sample_label_batches_order"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sample_label_batches_farm_plot"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sample_label_batches_created_at"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sample_label_batches"`);
  }
}
