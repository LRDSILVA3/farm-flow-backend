import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterAuditLogsCreatedAtTimestamptz1790856601756 implements MigrationInterface {
  name = 'AlterAuditLogsCreatedAtTimestamptz1790856601756';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'audit_logs'
            AND column_name = 'created_at'
            AND data_type = 'timestamp without time zone'
        ) THEN
          ALTER TABLE "audit_logs"
          ALTER COLUMN "created_at" TYPE TIMESTAMPTZ
          USING "created_at" AT TIME ZONE 'UTC';
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'audit_logs'
            AND column_name = 'created_at'
            AND data_type = 'timestamp with time zone'
        ) THEN
          ALTER TABLE "audit_logs"
          ALTER COLUMN "created_at" TYPE TIMESTAMP
          USING "created_at" AT TIME ZONE 'UTC';
        END IF;
      END
      $$;
    `);
  }
}

