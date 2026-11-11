import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableAuditLogs1790856601755 implements MigrationInterface {
  name = 'CreateTableAuditLogs1790856601755';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" character varying,
        "user_name" character varying,
        "user_email" character varying,
        "user_role" character varying,
        "module" character varying NOT NULL,
        "action" character varying NOT NULL,
        "entity_id" character varying,
        "entity_label" character varying,
        "summary" text NOT NULL,
        "changes" jsonb,
        "before_data" jsonb,
        "after_data" jsonb,
        "ip_address" character varying,
        "user_agent" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_audit_logs_created_at" ON "audit_logs" ("created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_audit_logs_module_entity" ON "audit_logs" ("module", "entity_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_audit_logs_user_id" ON "audit_logs" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_module_entity"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_created_at"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
  }
}

