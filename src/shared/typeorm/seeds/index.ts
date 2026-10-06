import 'reflect-metadata';
import { createConnection, getConnection } from 'typeorm';
import { hash } from 'bcryptjs';
import CostVariable from '@modules/cost-variables/typeorm/entities/CostVariable';
import Service from '@modules/services/typeorm/entities/Service';
import User from '@modules/user/typeorm/entities/User';

const initialCostVariables = [
  { name: 'Valor Oleo Diesel', code: 'VALOR_OLEO_DIESEL', value: 6.941176, unit: 'R$/L', category: 'Combustível', description: 'Valor do Oleo Diesel (R$/Lt) - BANCO DE DADOS!B25' },
  { name: 'Valor Diesel Padrão', code: 'VALOR_DIESEL', value: 6.94, unit: 'R$/L', category: 'Combustível', description: 'Valor de referência Diesel' },
  { name: 'Valor Alqueire Conferencia', code: 'VALOR_ALQ_CONFERENCIA', value: 65.00, unit: 'R$/Alq', category: 'Conferência', description: 'Valor por alqueire para o serviço de conferencia' },
  { name: 'Valor KM Conferencia Folha', code: 'VALOR_KM_CONFERENCIA_FOLHA', value: 4.96, unit: 'R$/km', category: 'Conferência', description: 'Valor por KM para conferencia de folha' },
  { name: 'Valor KM Conferencia Folha Calculado', code: 'VALOR_KM_CONFERENCIA_FOLHA_CALCULADO', value: 4.957983193277311, unit: 'R$/km', category: 'Conferência', description: 'Valor calculado KM conferencia folha' },
  { name: 'Valor Ponto Confere Compactacao', code: 'VALOR_PONTO_CONFERE_COMPACTACAO', value: 430.00, unit: 'R$/ponto', category: 'Conferência', description: 'Valor por ponto de conferencia de compactacao' },
  { name: 'Juros Pagamento Prazo Percentual', code: 'JUROS_PAGAMENTO_PRAZO_PERCENTUAL', value: 1.5, unit: '%/mês', category: 'Financeiro', description: 'Percentual de juros para pagamento a prazo' },
  { name: 'Data Base Calculo Juro', code: 'DATA_BASE_CALCULO_JURO', value: 20241231, unit: 'Data', category: 'Financeiro', description: 'Data base para cálculo de juros (YYYYMMDD)' },
  { name: 'Analise 20-40 CM Valor Analise', code: 'ANALISE_20_40_CM_VALOR_ANALISE', value: 70.00, unit: 'R$/análise', category: 'Laboratório', description: 'Valor da análise de 20-40 cm' },
  { name: 'Valor Analise Nova Area', code: 'VALOR_ANALISE_NOVA_AREA', value: 52.30, unit: 'R$/análise', category: 'Laboratório', description: 'Valor análise de nova área' },
  { name: 'Valor Analise Adubo Base', code: 'VALOR_ANALISE_ADUBO_BASE', value: 35.30, unit: 'R$/análise', category: 'Laboratório', description: 'Valor análise de adubo base' },
  { name: 'Valor Analise Enxofre', code: 'VALOR_ANALISE_ENXOFRE', value: 17.70, unit: 'R$/análise', category: 'Laboratório', description: 'Valor análise de enxofre' },
  { name: 'Valor Analise Fisica Unitario', code: 'VALOR_ANALISE_FISICA_UNITARIO', value: 42.30, unit: 'R$/análise', category: 'Laboratório', description: 'Valor análise física unitária' },
  { name: 'Analise Fisica Custo Adicional', code: 'ANALISE_FISICA_CUSTO_ADICIONAL', value: 175.30, unit: 'R$/análise', category: 'Laboratório', description: 'Custo adicional para análise física' },
  { name: 'Analise Macro Valor Analise', code: 'ANALISE_MACRO_VALOR_ANALISE', value: 52.30, unit: 'R$/análise', category: 'Laboratório', description: 'Valor da análise macro' },
  { name: 'Valor Analise Micronutrientes', code: 'VALOR_ANALISE_MICRONUTRIENTES', value: 20.00, unit: 'R$/análise', category: 'Laboratório', description: 'Valor análise de micronutrientes' },
  { name: 'Valor Analise Completa Unitario', code: 'VALOR_ANALISE_COMPLETA_UNITARIO', value: 147.30, unit: 'R$/análise', category: 'Laboratório', description: 'Valor análise completa unitária' },
  { name: 'Imposto Nota Fiscal Percentual', code: 'IMPOSTO_NOTA_FISCAL_PERCENTUAL', value: 5.0, unit: '%', category: 'Fiscal', description: 'Percentual de imposto para emissão de NF' },
  { name: 'Valor Viagem Conferencia Folha', code: 'VALOR_VIAGEM_CONFERENCIA_FOLHA', value: 330.00, unit: 'R$/viagem', category: 'Conferência', description: 'Valor por viagem para conferencia de folha' },
  { name: 'Valor Alqueire Folha', code: 'VALOR_ALQ_FOLHA', value: 60.00, unit: 'R$/Alq', category: 'Coleta Foliar', description: 'Valor/Alq folha' },
  { name: 'Valor Analise Foliar', code: 'VALOR_ANALISE_FOLIAR', value: 70.00, unit: 'R$/análise', category: 'Coleta Foliar', description: 'Valor da Análise Foliar (laboratório)' },
  { name: 'Valor Diaria Foliar', code: 'VALOR_DIARIA_FOLIAR', value: 180.00, unit: 'R$/dia', category: 'Coleta Foliar', description: 'Valor da diária para coleta foliar' },
  { name: 'Foliar Dias Pontos Max', code: 'FOLIAR_DIAS_PONTOS_MAX', value: 40.00, unit: 'pontos/dia', category: 'Coleta Foliar', description: 'Máximo de pontos coletados por dia' },
  { name: 'Foliar Base Alqueire Valor', code: 'FOLIAR_BASE_ALQUEIRE_VALOR', value: 55.00, unit: 'R$/Alq', category: 'Coleta Foliar', description: 'Valor base por alqueire' },
  { name: 'Foliar Base Ponto Valor', code: 'FOLIAR_BASE_PONTO_VALOR', value: 35.00, unit: 'R$/ponto', category: 'Coleta Foliar', description: 'Valor base por ponto foliar' },
  { name: 'Foliar Lab Macro Valor', code: 'FOLIAR_LAB_MACRO_VALOR', value: 40.00, unit: 'R$/amostra', category: 'Coleta Foliar', description: 'Valor laboratório macro foliar' },
  { name: 'Valor Km Frete', code: 'VALOR_KM_FRETE', value: 14.77, unit: 'R$/km', category: 'Logística', description: 'Valor do Km Frete caminhão carregado' },
  { name: 'Valor Km Deslocamento', code: 'VALOR_KM_DESLOCAMENTO', value: 6.12, unit: 'R$/km', category: 'Logística', description: 'Valor do Km Deslocamento caminhão vazio' },
  { name: 'Valor Km Rodado Padrão', code: 'VALOR_KM_RODADO', value: 1.50, unit: 'R$/km', category: 'Logística', description: 'Valor base km rodado' },
  { name: 'Despesa Viagem ATV', code: 'DESPESA_VIAGEM_ATV', value: 208.24, unit: 'R$/viagem', category: 'Aplicação ATV', description: 'Despesa/viagem que cobre 5km' },
  { name: 'ATV 1 Produto', code: 'ATV_1_PRODUTO', value: 290.00, unit: 'R$/Alq', category: 'Aplicação ATV', description: 'Valor/alq ATV para 1 produto' },
  { name: 'ATV 2 Produtos', code: 'ATV_2_PRODUTOS', value: 280.00, unit: 'R$/Alq', category: 'Aplicação ATV', description: 'Valor/alq ATV para 2 produtos' },
  { name: 'ATV 3 ou Mais Produtos', code: 'ATV_3_PRODUTOS', value: 260.00, unit: 'R$/Alq', category: 'Aplicação ATV', description: 'Valor/alq ATV para 3 ou mais produtos' },
  { name: 'Valor Aplicacao Esterco', code: 'VALOR_APLICACAO_ESTERCO', value: 40.40, unit: 'R$/ton', category: 'Aplicação ATV', description: 'Aplicação Esterco (R$/ton)' },
  { name: 'Diaria Pa Carregadeira', code: 'DIARIA_PA_CARREGADEIRA', value: 2600.00, unit: 'R$/dia', category: 'Equipamentos', description: 'Diária da Pá carregadeira' },
  { name: 'Hora Pa Carregadeira', code: 'HORA_PA_CARREGADEIRA', value: 390.00, unit: 'R$/h', category: 'Equipamentos', description: 'Valor da hora da pá carregadeira' },
  { name: 'Voo Drone Alq Ano', code: 'VOO_DRONE_ALQ_ANO', value: 50.00, unit: 'R$/Alq', category: 'Drone Mapeamento', description: 'Voo de Drone/Alq/Ano' },
  { name: 'Valor Ha Drone Mapeamento', code: 'VALOR_HA_DRONE_MAP', value: 18.00, unit: 'R$/ha', category: 'Drone Mapeamento', description: 'Valor base por hectare mapeamento' },
  { name: 'Drone Pulverizacao Base Alq', code: 'DRONE_PULVE_BASE_ALQ', value: 240.00, unit: 'R$/Alq', category: 'Drone Pulverização', description: 'R$/Alq base cálculo pulverização drone' },
  { name: 'Drone Pulverizacao Preco Minimo Alq', code: 'DRONE_PULVE_PRECO_MINIMO_ALQ', value: 270.00, unit: 'R$/Alq', category: 'Drone Pulverização', description: 'Preço mínimo/alq pulverização drone' },
  { name: 'Drone Pulverizacao Preco Programada', code: 'DRONE_PULVE_PRECO_PROGRAMADA', value: 240.00, unit: 'R$/Alq', category: 'Drone Pulverização', description: 'Preço área programada pulverização drone' },
  { name: 'Drone Valor Obstaculo', code: 'DRONE_VALOR_OBSTACULO', value: 100.00, unit: 'R$/obstáculo', category: 'Drone Pulverização', description: 'R$/obstáculo pulverização drone' },
  { name: 'Drone Valor Beira Mato', code: 'DRONE_VALOR_BEIRA_MATO', value: 0.50, unit: 'R$/m', category: 'Drone Pulverização', description: 'R$/beira de mato (metro) pulverização drone' },
  { name: 'Drone Valor Fio Luz', code: 'DRONE_VALOR_FIO_LUZ', value: 1.00, unit: 'R$/m', category: 'Drone Pulverização', description: 'R$/fio de luz (metro) pulverização drone' },
  { name: 'Drone Valor Ponto RTK', code: 'DRONE_VALOR_PONTO_RTK', value: 500.00, unit: 'R$/ponto', category: 'Drone Pulverização', description: 'R$/ponto RTK pulverização drone' },
  { name: 'Valor Ha Drone Spray', code: 'VALOR_HA_DRONE_SPRAY', value: 45.00, unit: 'R$/ha', category: 'Drone Pulverização', description: 'Valor base hectare pulverização drone' },
  { name: 'AP Ate 50 Alqueires', code: 'AP_ATE_50_ALQ', value: 295.00, unit: 'R$/Alq', category: 'Amostragem AP', description: 'R$/Alq AP até 50 alq' },
  { name: 'AP 50 a 100 Alqueires', code: 'AP_50_A_100_ALQ', value: 278.3018867924528, unit: 'R$/Alq', category: 'Amostragem AP', description: 'R$/Alq AP 50 a 100 alq' },
  { name: 'AP Mais de 100 Alqueires', code: 'AP_MAIS_100_ALQ', value: 262.5489498042008, unit: 'R$/Alq', category: 'Amostragem AP', description: 'R$/Alq AP mais de 100 alq' },
  { name: 'Tier 1 AP Price', code: 'TIER_1_AP_PRICE', value: 295.00, unit: 'R$/Alq', category: 'Amostragem AP', description: 'Preço base tier 1 AP' },
  { name: 'Reanalise Ate 50 Alqueires', code: 'REANALISE_ATE_50_ALQ', value: 280.00, unit: 'R$/Alq', category: 'Amostragem AP', description: 'R$/Alq Reanálise até 50 alq' },
  { name: 'Reanalise 50 a 100 Alqueires', code: 'REANALISE_50_A_100_ALQ', value: 264.15, unit: 'R$/Alq', category: 'Amostragem AP', description: 'R$/Alq Reanálise 50 a 100 alq' },
  { name: 'Reanalise Mais de 100 Alqueires', code: 'REANALISE_MAIS_100_ALQ', value: 249.20, unit: 'R$/Alq', category: 'Amostragem AP', description: 'R$/Alq Reanálise mais de 100 alq' },
  { name: 'Valor Ponto Amostragem Solo', code: 'VALOR_PONTO_AMOSTRAGEM_SOLO', value: 40.00, unit: 'R$/ponto', category: 'Amostragem AP', description: 'Valor por ponto de amostragem de solo' },
  { name: 'Valor Ha Compactacao', code: 'VALOR_HA_COMPACTACAO', value: 25.00, unit: 'R$/ha', category: 'Compactação de Solo', description: 'Valor por hectare compactação' },
  { name: 'Valor Diaria Geral', code: 'VALOR_DIARIA', value: 150.00, unit: 'R$/dia', category: 'Geral', description: 'Valor diária geral de campo' },
  { name: 'Taxa Depreciacao Equipamento', code: 'TAXA_DEPREC_EQUIP', value: 0.10, unit: 'taxa', category: 'Equipamentos', description: 'Taxa de depreciação de equipamento' },
  { name: 'Custo Analise Macro', code: 'CUSTO_ANALISE_MACRO', value: 45.00, unit: 'R$/análise', category: 'Laboratório', description: 'Custo de referência análise macro' },
  { name: 'Custo Analise Fisica', code: 'CUSTO_ANALISE_FISICA', value: 25.00, unit: 'R$/análise', category: 'Laboratório', description: 'Custo de referência análise física' },
];

const initialServices = [
  { name: 'Conferência', status: 'Ativo', is_fixed: true, value_per_alqueire: '65.00' },
  { name: 'Coleta Foliar', status: 'Ativo', is_fixed: true, value_per_alqueire: '60.00' },
  { name: 'Compactação de Solo', status: 'Ativo', is_fixed: true, value_per_alqueire: '25.00' },
  { name: 'Voo de Drone (Mapeamento)', status: 'Ativo', is_fixed: true, value_per_alqueire: '50.00' },
  { name: 'Aplicação ATV', status: 'Ativo', is_fixed: true, value_per_alqueire: '290.00' },
  { name: 'Amostragem de Solo (AP)', status: 'Ativo', is_fixed: true, value_per_alqueire: '295.00' },
  { name: 'Pulverização Drone', status: 'Ativo', is_fixed: true, value_per_alqueire: '240.00' },
  { name: 'Equalização de Serviços', status: 'Ativo', is_fixed: true, value_per_alqueire: '0.00' },
];

async function seed() {
  console.log('🌱 Starting Database Seeding...');
  const connection = await createConnection();

  try {
    // 1. Seed Cost Variables
    const costVariableRepo = connection.getRepository(CostVariable);
    console.log(`📦 Seeding ${initialCostVariables.length} Cost Variables...`);
    for (const item of initialCostVariables) {
      let existing = await costVariableRepo.findOne({ where: { code: item.code } });
      if (existing) {
        existing.name = item.name;
        existing.value = item.value;
        existing.unit = item.unit;
        existing.category = item.category;
        existing.description = item.description;
        await costVariableRepo.save(existing);
      } else {
        const created = costVariableRepo.create(item);
        await costVariableRepo.save(created);
      }
    }
    console.log('✅ Cost Variables seeded successfully.');

    // 2. Seed Services
    const serviceRepo = connection.getRepository(Service);
    console.log(`🛠️ Seeding ${initialServices.length} System Services...`);
    for (const s of initialServices) {
      let existing = await serviceRepo.findOne({ where: { name: s.name } });
      if (existing) {
        existing.status = s.status;
        existing.is_fixed = s.is_fixed;
        existing.value_per_alqueire = s.value_per_alqueire;
        await serviceRepo.save(existing);
      } else {
        const created = serviceRepo.create(s);
        await serviceRepo.save(created);
      }
    }
    console.log('✅ System Services seeded successfully.');

    // 3. Seed Default Admin User
    const userRepo = connection.getRepository(User);
    const adminEmail = 'admin@farmflow.com';
    let admin = await userRepo.findOne({ where: { email: adminEmail } });
    if (!admin) {
      const hashedPassword = await hash('admin123', 8);
      admin = userRepo.create({
        name: 'Administrador FarmFlow',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
      });
      await userRepo.save(admin);
      console.log('👤 Admin user created: admin@farmflow.com / admin123');
    } else {
      console.log('👤 Admin user already exists: admin@farmflow.com');
    }

    console.log('🎉 Seeding finished successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await connection.close();
  }
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
