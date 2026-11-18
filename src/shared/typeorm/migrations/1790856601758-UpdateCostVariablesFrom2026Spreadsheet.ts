import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCostVariablesFrom2026Spreadsheet1790856601758 implements MigrationInterface {
  name = 'UpdateCostVariablesFrom2026Spreadsheet1790856601758';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Atualizar ou inserir novas variáveis de custo (valores oficiais planilha 2026 LucasRafael.xlsm)
    const costVariables = [
      // Combustível
      { code: 'VALOR_OLEO_DIESEL', name: 'Valor Oleo Diesel', value: 8.375000, unit: 'R$/L', category: 'Combustível', description: 'Valor do Oleo Diesel (R$/Lt) - BANCO DE DADOS!B25' },
      { code: 'VALOR_DIESEL', name: 'Valor Diesel Padrão', value: 8.380000, unit: 'R$/L', category: 'Combustível', description: 'Valor de referência Diesel' },

      // Conferência
      { code: 'VALOR_ALQ_CONFERENCIA', name: 'Valor Alqueire Conferencia', value: 71.666667, unit: 'R$/Alq', category: 'Conferência', description: 'Valor por alqueire para o serviço de conferencia (BANCO DE DADOS!B10)' },
      { code: 'VALOR_KM_CONFERENCIA_FOLHA', name: 'Valor KM Conferencia Folha', value: 4.785714, unit: 'R$/km', category: 'Conferência', description: 'Valor por KM para conferencia de folha (BANCO DE DADOS!B12)' },
      { code: 'VALOR_KM_CONFERENCIA_FOLHA_CALCULADO', name: 'Valor KM Conferencia Folha Calculado', value: 4.785714, unit: 'R$/km', category: 'Conferência', description: 'Valor calculado KM conferencia folha' },
      { code: 'VALOR_PONTO_CONFERE_COMPACTACAO', name: 'Valor Ponto Confere Compactacao', value: 361.111111, unit: 'R$/ponto', category: 'Conferência', description: 'Valor por ponto de conferencia de compactacao (BANCO DE DADOS!B8)' },
      { code: 'VALOR_VIAGEM_CONFERENCIA_FOLHA', name: 'Valor Viagem Conferencia Folha', value: 366.666667, unit: 'R$/viagem', category: 'Conferência', description: 'Valor por viagem para conferencia de folha (BANCO DE DADOS!B13)' },

      // Financeiro
      { code: 'JUROS_PAGAMENTO_PRAZO_PERCENTUAL', name: 'Juros Pagamento Prazo Percentual', value: 1.200000, unit: '%/mês', category: 'Financeiro', description: 'Percentual de juros para pagamento a prazo (BANCO DE DADOS!B40)' },
      { code: 'DATA_BASE_CALCULO_JURO', name: 'Data Base Calculo Juro', value: 20251231, unit: 'Data', category: 'Financeiro', description: 'Data base para cálculo de juros YYYYMMDD (BANCO DE DADOS!B27 = 46022 = 31/12/2025)' },
      { code: 'DATA_BASE_CALCULO_JURO_DRONE', name: 'Data Base Calculo Juro Drone', value: 20251231, unit: 'Data', category: 'Financeiro', description: 'Data base para cálculo de juro drone (PEDIDO DRONE M31 = 46022 = 31/12/2025)' },
      { code: 'PRAZO_MAXIMO_DATA', name: 'Prazo Máximo Data Base', value: 20261230, unit: 'Data', category: 'Financeiro', description: 'Prazo máximo data YYYYMMDD (BANCO DE DADOS!B37 = 46386 = 30/12/2026)' },

      // Laboratório / Análises de Solo
      { code: 'ANALISE_20_40_CM_VALOR_ANALISE', name: 'Analise 20-40 CM Valor Analise', value: 73.900000, unit: 'R$/análise', category: 'Laboratório', description: 'Valor da análise de 20-40 cm (INPUT DADOS!C23)' },
      { code: 'VALOR_ANALISE_NOVA_AREA', name: 'Valor Analise Nova Area', value: 61.400000, unit: 'R$/análise', category: 'Laboratório', description: 'Valor análise de nova área / Adubação Corretiva (INPUT DADOS!D3)' },
      { code: 'VALOR_ANALISE_ADUBO_BASE', name: 'Valor Analise Adubo Base', value: 17.500000, unit: 'R$/análise', category: 'Laboratório', description: 'Valor análise de adubo base (INPUT DADOS!D4)' },
      { code: 'VALOR_ANALISE_ENXOFRE', name: 'Valor Analise Enxofre', value: 12.500000, unit: 'R$/análise', category: 'Laboratório', description: 'Valor análise de enxofre (INPUT DADOS!D5)' },
      { code: 'VALOR_ANALISE_MICRONUTRIENTES', name: 'Valor Analise Micronutrientes', value: 29.550000, unit: 'R$/análise', category: 'Laboratório', description: 'Valor análise de micronutrientes (INPUT DADOS!D6)' },
      { code: 'VALOR_ANALISE_FISICA_UNITARIO', name: 'Valor Analise Fisica Unitario', value: 33.300000, unit: 'R$/análise', category: 'Laboratório', description: 'Valor análise física unitária (INPUT DADOS!C24)' },
      { code: 'ANALISE_MACRO_VALOR_ANALISE', name: 'Analise Macro Valor Analise', value: 61.400000, unit: 'R$/análise', category: 'Laboratório', description: 'Valor da análise macro (INPUT DADOS!D3)' },
      { code: 'VALOR_ANALISE_COMPLETA_UNITARIO', name: 'Valor Analise Completa Unitario', value: 91.400000, unit: 'R$/análise', category: 'Laboratório', description: 'Valor análise completa unitária (INPUT DADOS!B7)' },
      { code: 'VALOR_LAB_BIOAS', name: 'Valor Laboratório BIOAS', value: 205.200000, unit: 'R$/análise', category: 'Laboratório', description: 'Valor laboratório BIOAS (PrimorLab) - BANCO DE DADOS!B48' },

      // Coleta Foliar
      { code: 'VALOR_ALQ_FOLHA', name: 'Valor Alqueire Folha', value: 18.000000, unit: 'R$/Alq', category: 'Coleta Foliar', description: 'Valor/Alq folha (BANCO DE DADOS!B9)' },
      { code: 'VALOR_ANALISE_FOLIAR', name: 'Valor Analise Foliar', value: 90.000000, unit: 'R$/análise', category: 'Coleta Foliar', description: 'Valor da Análise Foliar laboratório (BANCO DE DADOS!B11)' },

      // Logística
      { code: 'VALOR_KM_FRETE', name: 'Valor Km Frete', value: 17.820000, unit: 'R$/km', category: 'Logística', description: 'Valor do Km Frete caminhão carregado (BANCO DE DADOS!B21)' },
      { code: 'VALOR_KM_DESLOCAMENTO', name: 'Valor Km Deslocamento', value: 7.390000, unit: 'R$/km', category: 'Logística', description: 'Valor do Km Deslocamento caminhão vazio (BANCO DE DADOS!B22)' },
      { code: 'VALOR_KM_DESLOCAMENTO_VAZIO', name: 'Valor Km Deslocamento Caminhao Vazio', value: 7.390000, unit: 'R$/km', category: 'Logística', description: 'Valor por km de deslocamento do caminhão vazio (BANCO DE DADOS!B22)' },
      { code: 'VALOR_KM_DESLOCAMENTO_PRANCHA', name: 'Valor Km Deslocamento Caminhao Prancha', value: 13.000000, unit: 'R$/km', category: 'Logística', description: 'Valor do Km deslocamento caminhao prancha (BANCO DE DADOS!B28)' },

      // Aplicação ATV
      { code: 'DESPESA_VIAGEM_ATV', name: 'Despesa Viagem ATV', value: 251.250000, unit: 'R$/viagem', category: 'Aplicação ATV', description: 'Despesa/viagem que cobre 5km (BANCO DE DADOS!B19)' },
      { code: 'ATV_1_PRODUTO', name: 'ATV 1 Produto', value: 315.000000, unit: 'R$/Alq', category: 'Aplicação ATV', description: 'Valor/alq ATV para 1 produto (BANCO DE DADOS!B16)' },
      { code: 'ATV_2_PRODUTOS', name: 'ATV 2 Produtos', value: 310.000000, unit: 'R$/Alq', category: 'Aplicação ATV', description: 'Valor/alq ATV para 2 produtos (BANCO DE DADOS!B17)' },
      { code: 'ATV_3_PRODUTOS', name: 'ATV 3 ou Mais Produtos', value: 300.000000, unit: 'R$/Alq', category: 'Aplicação ATV', description: 'Valor/alq ATV para 3 ou mais produtos (BANCO DE DADOS!B18)' },
      { code: 'VALOR_APLICACAO_ESTERCO', name: 'Valor Aplicacao Esterco', value: 45.000000, unit: 'R$/ton', category: 'Aplicação ATV', description: 'Aplicação Esterco R$/ton (BANCO DE DADOS!B24)' },

      // Equipamentos
      { code: 'DIARIA_PA_CARREGADEIRA', name: 'Diaria Pa Carregadeira', value: 2400.000000, unit: 'R$/dia', category: 'Equipamentos', description: 'Diária da Pá carregadeira (BANCO DE DADOS!B20)' },
      { code: 'HORA_PA_CARREGADEIRA', name: 'Hora Pa Carregadeira', value: 360.000000, unit: 'R$/h', category: 'Equipamentos', description: 'Valor da hora da pá carregadeira (BANCO DE DADOS!B43)' },

      // Amostragem AP
      { code: 'AP_ATE_50_ALQ', name: 'AP Ate 50 Alqueires', value: 345.124551, unit: 'R$/Alq', category: 'Amostragem AP', description: 'R$/Alq AP até 50 alq (BANCO DE DADOS!B3)' },
      { code: 'AP_50_A_100_ALQ', name: 'AP 50 a 100 Alqueires', value: 325.589199, unit: 'R$/Alq', category: 'Amostragem AP', description: 'R$/Alq AP 50 a 100 alq (BANCO DE DADOS!B4)' },
      { code: 'AP_MAIS_100_ALQ', name: 'AP Mais de 100 Alqueires', value: 307.159622, unit: 'R$/Alq', category: 'Amostragem AP', description: 'R$/Alq AP mais de 100 alq (BANCO DE DADOS!B5)' },
      { code: 'TIER_1_AP_PRICE', name: 'Tier 1 AP Price', value: 345.124551, unit: 'R$/Alq', category: 'Amostragem AP', description: 'Preço base tier 1 AP' },
      { code: 'REANALISE_ATE_50_ALQ', name: 'Reanalise Ate 50 Alqueires', value: 330.124551, unit: 'R$/Alq', category: 'Amostragem AP', description: 'R$/Alq Reanálise até 50 alq (BANCO DE DADOS!C3)' },
      { code: 'REANALISE_50_A_100_ALQ', name: 'Reanalise 50 a 100 Alqueires', value: 311.438256, unit: 'R$/Alq', category: 'Amostragem AP', description: 'R$/Alq Reanálise 50 a 100 alq (BANCO DE DADOS!C4)' },
      { code: 'REANALISE_MAIS_100_ALQ', name: 'Reanalise Mais de 100 Alqueires', value: 293.809675, unit: 'R$/Alq', category: 'Amostragem AP', description: 'R$/Alq Reanálise mais de 100 alq (BANCO DE DADOS!C5)' },
      { code: 'DESCONTO_SEM_FORMULA_ADUBO', name: 'Desconto Sem Formula Adubo', value: 0.800000, unit: 'fator', category: 'Amostragem AP', description: 'Fator de desconto se sem fórmula de adubo (BANCO DE DADOS!B6)' },
    ];

    for (const v of costVariables) {
      await queryRunner.query(`
        INSERT INTO "cost_variables" ("id", "code", "name", "value", "unit", "category", "description", "updated_at")
        VALUES (uuid_generate_v4(), '${v.code}', '${v.name}', ${v.value}, '${v.unit}', '${v.category}', '${v.description}', now())
        ON CONFLICT ("code") DO UPDATE SET
          "value" = ${v.value},
          "unit" = '${v.unit}',
          "category" = '${v.category}',
          "description" = '${v.description}',
          "updated_at" = now();
      `);
    }

    // 2. Atualizar tabela de serviços com novos valores de referência por alqueire
    await queryRunner.query(`UPDATE "services" SET "value_per_alqueire" = '345.12', "updated_at" = now() WHERE "name" = 'Amostragem de Solo (AP)'`);
    await queryRunner.query(`UPDATE "services" SET "value_per_alqueire" = '71.67', "updated_at" = now() WHERE "name" = 'Conferência'`);
    await queryRunner.query(`UPDATE "services" SET "value_per_alqueire" = '18.00', "updated_at" = now() WHERE "name" = 'Coleta Foliar'`);
    await queryRunner.query(`UPDATE "services" SET "value_per_alqueire" = '315.00', "updated_at" = now() WHERE "name" = 'Aplicação ATV'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter para valores 2024/2025 anteriores caso necessário
    await queryRunner.query(`UPDATE "cost_variables" SET "value" = 295.000000 WHERE "code" = 'AP_ATE_50_ALQ'`);
    await queryRunner.query(`UPDATE "cost_variables" SET "value" = 278.301887 WHERE "code" = 'AP_50_A_100_ALQ'`);
    await queryRunner.query(`UPDATE "cost_variables" SET "value" = 262.548950 WHERE "code" = 'AP_MAIS_100_ALQ'`);
    await queryRunner.query(`UPDATE "cost_variables" SET "value" = 280.000000 WHERE "code" = 'REANALISE_ATE_50_ALQ'`);
    await queryRunner.query(`UPDATE "cost_variables" SET "value" = 264.150943 WHERE "code" = 'REANALISE_50_A_100_ALQ'`);
    await queryRunner.query(`UPDATE "cost_variables" SET "value" = 249.199003 WHERE "code" = 'REANALISE_MAIS_100_ALQ'`);
    await queryRunner.query(`UPDATE "cost_variables" SET "value" = 6.941176 WHERE "code" = 'VALOR_OLEO_DIESEL'`);
    await queryRunner.query(`UPDATE "cost_variables" SET "value" = 65.000000 WHERE "code" = 'VALOR_ALQ_CONFERENCIA'`);
    await queryRunner.query(`UPDATE "cost_variables" SET "value" = 60.000000 WHERE "code" = 'VALOR_ALQ_FOLHA'`);
    await queryRunner.query(`UPDATE "cost_variables" SET "value" = 70.000000 WHERE "code" = 'VALOR_ANALISE_FOLIAR'`);
    await queryRunner.query(`UPDATE "cost_variables" SET "value" = 430.000000 WHERE "code" = 'VALOR_PONTO_CONFERE_COMPACTACAO'`);
    await queryRunner.query(`UPDATE "cost_variables" SET "value" = 290.000000 WHERE "code" = 'ATV_1_PRODUTO'`);
    await queryRunner.query(`UPDATE "cost_variables" SET "value" = 280.000000 WHERE "code" = 'ATV_2_PRODUTOS'`);
    await queryRunner.query(`UPDATE "cost_variables" SET "value" = 260.000000 WHERE "code" = 'ATV_3_PRODUTOS'`);
    await queryRunner.query(`UPDATE "cost_variables" SET "value" = 20241231 WHERE "code" = 'DATA_BASE_CALCULO_JURO'`);
    await queryRunner.query(`UPDATE "cost_variables" SET "value" = 1.500000 WHERE "code" = 'JUROS_PAGAMENTO_PRAZO_PERCENTUAL'`);
  }
}

