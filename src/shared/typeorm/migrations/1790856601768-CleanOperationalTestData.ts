import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanOperationalTestData1790856601768 implements MigrationInterface {
  name = 'CleanOperationalTestData1790856601768';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tablesToClean = [
      'service_executions',
      'sample_label_batches',
      'analyses',
      'sales_products',
      'sales',
      'financial_transactions',
      'stock_movements',
      'orders',
      'plots',
      'farms',
      'clients',
      'audit_logs',
    ];

    for (const table of tablesToClean) {
      try {
        await queryRunner.query(`TRUNCATE TABLE "${table}" CASCADE;`);
      } catch {
        // Tabela inexistente em versões anteriores é ignorada com segurança
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Limpeza de dados operacionais
  }
}
