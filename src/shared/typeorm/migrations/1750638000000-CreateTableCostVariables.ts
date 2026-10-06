import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTableCostVariables1750638000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'cost_variables',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'code',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'value',
            type: 'decimal',
            precision: 16,
            scale: 6,
          },
          {
            name: 'unit',
            type: 'varchar',
          },
          {
            name: 'category',
            type: 'varchar',
            default: "'Geral'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('cost_variables');
  }
}
