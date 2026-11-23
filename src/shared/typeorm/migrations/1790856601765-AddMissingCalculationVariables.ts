import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingCalculationVariables1790856601765 implements MigrationInterface {
  name = 'AddMissingCalculationVariables1790856601765';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const newVariables = [
      {
        code: 'DRONE_LIMITE_DOSE_SOLIDO_KG_ALQ',
        name: 'Drone Limite Dose Solido (Kg/Alq)',
        value: 100.0,
        unit: 'Kg/Alq',
        category: 'Drone Pulverização',
        description: 'Kg/alq de sólido limite para início do reajuste de dose (BANCO DE DADOS!B41)',
      },
      {
        code: 'ATV_LIMITE_DESLOCAMENTO_VAZIO_PERCENTUAL',
        name: 'ATV Limite Deslocamento Vazio (%)',
        value: 20.0,
        unit: '%',
        category: 'Aplicação ATV',
        description: 'Percentual limite do deslocamento vazio sobre o serviço para cobrança adicional (INPUT ATV!Q20)',
      },
      {
        code: 'ATV_LIMITE_TON_HA_DOSE_ALTA',
        name: 'ATV Limite Dose Alta (Ton/Ha)',
        value: 5.5,
        unit: 'Ton/Ha',
        category: 'Aplicação ATV',
        description: 'Dose mínima em Ton/Ha para cobrança por tonelada em ATV (INPUT ATV!F10)',
      },
      {
        code: 'ATV_FATOR_DOSE_ALTA',
        name: 'ATV Fator Dose Alta',
        value: 0.75,
        unit: 'fator',
        category: 'Aplicação ATV',
        description: 'Fator multiplicador sobre aplicação de esterco para doses >= 5.5 Ton/Ha (INPUT ATV!F10)',
      },
    ];

    for (const v of newVariables) {
      await queryRunner.query(`
        INSERT INTO "cost_variables" ("id", "code", "name", "value", "unit", "category", "description", "updated_at")
        VALUES (uuid_generate_v4(), '${v.code}', '${v.name}', ${v.value}, '${v.unit}', '${v.category}', '${v.description}', now())
        ON CONFLICT ("code") DO UPDATE SET
          "name" = '${v.name}',
          "unit" = '${v.unit}',
          "category" = '${v.category}',
          "description" = '${v.description}',
          "updated_at" = now();
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "cost_variables"
      WHERE "code" IN (
        'DRONE_LIMITE_DOSE_SOLIDO_KG_ALQ',
        'ATV_LIMITE_DESLOCAMENTO_VAZIO_PERCENTUAL',
        'ATV_LIMITE_TON_HA_DOSE_ALTA',
        'ATV_FATOR_DOSE_ALTA'
      )
    `);
  }
}
