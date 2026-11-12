import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefaultCommercialDiscountCostVariable1790856601757 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "cost_variables" ("name", "code", "value", "unit", "category", "description")
      SELECT 
        'Desconto Comercial Padrão Sugerido',
        'DESCONTO_COMERCIAL_PADRAO_PERCENTUAL',
        0.000000,
        '%',
        'Comercial',
        'Percentual padrão pré-selecionado de desconto comercial nos pedidos e orçamentos (editável)'
      WHERE NOT EXISTS (
        SELECT 1 FROM "cost_variables" WHERE "code" = 'DESCONTO_COMERCIAL_PADRAO_PERCENTUAL'
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "cost_variables" WHERE "code" = 'DESCONTO_COMERCIAL_PADRAO_PERCENTUAL';
    `);
  }
}
