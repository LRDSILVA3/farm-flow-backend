import 'reflect-metadata';
import { createConnection } from 'typeorm';
import { hash } from 'bcryptjs';
import CostVariable from '@modules/cost-variables/typeorm/entities/CostVariable';
import Service from '@modules/services/typeorm/entities/Service';
import ServiceProduct from '@modules/services/typeorm/entities/ServiceProduct';
import Product from '@modules/products/typeorm/entities/Product';
import Farm from '@modules/farms/typeorm/entities/Farm';
import Plot from '@modules/farms/typeorm/entities/Plot';
import Order from '@modules/orders/typeorm/entities/Order';
import User from '@modules/user/typeorm/entities/User';

const initialCostVariables = [
  { name: 'Valor Oleo Diesel', code: 'VALOR_OLEO_DIESEL', value: 8.375, unit: 'R$/L', category: 'Combustível', description: 'Valor do Oleo Diesel (R$/Lt) - BANCO DE DADOS!B25' },
  { name: 'Valor Diesel Padrão', code: 'VALOR_DIESEL', value: 8.38, unit: 'R$/L', category: 'Combustível', description: 'Valor de referência Diesel' },
  { name: 'Valor Alqueire Conferencia', code: 'VALOR_ALQ_CONFERENCIA', value: 71.666667, unit: 'R$/Alq', category: 'Conferência', description: 'Valor por alqueire para o serviço de conferencia (BANCO DE DADOS!B10)' },
  { name: 'Valor KM Conferencia Folha', code: 'VALOR_KM_CONFERENCIA_FOLHA', value: 4.785714, unit: 'R$/km', category: 'Conferência', description: 'Valor por KM para conferencia de folha (BANCO DE DADOS!B12)' },
  { name: 'Valor KM Conferencia Folha Calculado', code: 'VALOR_KM_CONFERENCIA_FOLHA_CALCULADO', value: 4.785714285714286, unit: 'R$/km', category: 'Conferência', description: 'Valor calculado KM conferencia folha' },
  { name: 'Valor Ponto Confere Compactacao', code: 'VALOR_PONTO_CONFERE_COMPACTACAO', value: 361.111111, unit: 'R$/ponto', category: 'Conferência', description: 'Valor por ponto de conferencia de compactacao (BANCO DE DADOS!B8)' },
  { name: 'Juros Pagamento Prazo Percentual', code: 'JUROS_PAGAMENTO_PRAZO_PERCENTUAL', value: 1.2, unit: '%/mês', category: 'Financeiro', description: 'Percentual de juros para pagamento a prazo (BANCO DE DADOS!B40)' },
  { name: 'Data Base Calculo Juro', code: 'DATA_BASE_CALCULO_JURO', value: 20251231, unit: 'Data', category: 'Financeiro', description: 'Data base para cálculo de juros (YYYYMMDD = 46022 = 31/12/2025)' },
  { name: 'Data Base Calculo Juro Drone', code: 'DATA_BASE_CALCULO_JURO_DRONE', value: 20251231, unit: 'Data', category: 'Financeiro', description: 'Data base para cálculo de juro drone (PEDIDO DRONE M31 = 46022 = 31/12/2025)' },
  { name: 'Prazo Máximo Data Base', code: 'PRAZO_MAXIMO_DATA', value: 20261230, unit: 'Data', category: 'Financeiro', description: 'Prazo máximo data YYYYMMDD (BANCO DE DADOS!B37 = 46386 = 30/12/2026)' },
  { name: 'Desconto Comercial Padrão Sugerido', code: 'DESCONTO_COMERCIAL_PADRAO_PERCENTUAL', value: 0.0, unit: '%', category: 'Financeiro', description: 'Percentual padrão de desconto comercial pré-selecionado no pedido' },
  { name: 'Analise 20-40 CM Valor Analise', code: 'ANALISE_20_40_CM_VALOR_ANALISE', value: 73.90, unit: 'R$/análise', category: 'Laboratório', description: 'Valor da análise de 20-40 cm (INPUT DADOS!C23)' },
  { name: 'Valor Analise Nova Area', code: 'VALOR_ANALISE_NOVA_AREA', value: 61.40, unit: 'R$/análise', category: 'Laboratório', description: 'Valor análise de nova área / Adubação Corretiva (INPUT DADOS!D3)' },
  { name: 'Valor Analise Adubo Base', code: 'VALOR_ANALISE_ADUBO_BASE', value: 17.50, unit: 'R$/análise', category: 'Laboratório', description: 'Valor análise de adubo base (INPUT DADOS!D4)' },
  { name: 'Valor Analise Enxofre', code: 'VALOR_ANALISE_ENXOFRE', value: 12.50, unit: 'R$/análise', category: 'Laboratório', description: 'Valor análise de enxofre (INPUT DADOS!D5)' },
  { name: 'Valor Analise Fisica Unitario', code: 'VALOR_ANALISE_FISICA_UNITARIO', value: 33.30, unit: 'R$/análise', category: 'Laboratório', description: 'Valor análise física unitária (INPUT DADOS!C24)' },
  { name: 'Analise Fisica Custo Adicional', code: 'ANALISE_FISICA_CUSTO_ADICIONAL', value: 175.30, unit: 'R$/análise', category: 'Laboratório', description: 'Custo adicional para análise física' },
  { name: 'Analise Macro Valor Analise', code: 'ANALISE_MACRO_VALOR_ANALISE', value: 61.40, unit: 'R$/análise', category: 'Laboratório', description: 'Valor da análise macro (INPUT DADOS!D3)' },
  { name: 'Valor Analise Micronutrientes', code: 'VALOR_ANALISE_MICRONUTRIENTES', value: 29.55, unit: 'R$/análise', category: 'Laboratório', description: 'Valor análise de micronutrientes (INPUT DADOS!D6)' },
  { name: 'Valor Analise Completa Unitario', code: 'VALOR_ANALISE_COMPLETA_UNITARIO', value: 91.40, unit: 'R$/análise', category: 'Laboratório', description: 'Valor análise completa unitária (INPUT DADOS!B7)' },
  { name: 'Valor Laboratório BIOAS', code: 'VALOR_LAB_BIOAS', value: 205.20, unit: 'R$/análise', category: 'Laboratório', description: 'Valor laboratório BIOAS (PrimorLab) - BANCO DE DADOS!B48' },
  { name: 'Imposto Nota Fiscal Percentual', code: 'IMPOSTO_NOTA_FISCAL_PERCENTUAL', value: 5.0, unit: '%', category: 'Fiscal', description: 'Percentual de imposto para emissão de NF' },
  { name: 'Valor Viagem Conferencia Folha', code: 'VALOR_VIAGEM_CONFERENCIA_FOLHA', value: 366.666667, unit: 'R$/viagem', category: 'Conferência', description: 'Valor por viagem para conferencia de folha (BANCO DE DADOS!B13)' },
  { name: 'Valor Alqueire Folha', code: 'VALOR_ALQ_FOLHA', value: 18.00, unit: 'R$/Alq', category: 'Coleta Foliar', description: 'Valor/Alq folha (BANCO DE DADOS!B9)' },
  { name: 'Valor Analise Foliar', code: 'VALOR_ANALISE_FOLIAR', value: 90.00, unit: 'R$/análise', category: 'Coleta Foliar', description: 'Valor da Análise Foliar laboratório (BANCO DE DADOS!B11)' },
  { name: 'Valor Diaria Foliar', code: 'VALOR_DIARIA_FOLIAR', value: 180.00, unit: 'R$/dia', category: 'Coleta Foliar', description: 'Valor da diária para coleta foliar' },
  { name: 'Foliar Dias Pontos Max', code: 'FOLIAR_DIAS_PONTOS_MAX', value: 40.00, unit: 'pontos/dia', category: 'Coleta Foliar', description: 'Máximo de pontos coletados por dia' },
  { name: 'Foliar Base Alqueire Valor', code: 'FOLIAR_BASE_ALQUEIRE_VALOR', value: 55.00, unit: 'R$/Alq', category: 'Coleta Foliar', description: 'Valor base por alqueire' },
  { name: 'Foliar Base Ponto Valor', code: 'FOLIAR_BASE_PONTO_VALOR', value: 35.00, unit: 'R$/ponto', category: 'Coleta Foliar', description: 'Valor base por ponto foliar' },
  { name: 'Foliar Lab Macro Valor', code: 'FOLIAR_LAB_MACRO_VALOR', value: 40.00, unit: 'R$/amostra', category: 'Coleta Foliar', description: 'Valor laboratório macro foliar' },
  { name: 'Valor Km Frete', code: 'VALOR_KM_FRETE', value: 17.82, unit: 'R$/km', category: 'Logística', description: 'Valor do Km Frete caminhão carregado (BANCO DE DADOS!B21)' },
  { name: 'Valor Km Deslocamento', code: 'VALOR_KM_DESLOCAMENTO', value: 7.39, unit: 'R$/km', category: 'Logística', description: 'Valor do Km Deslocamento caminhão vazio (BANCO DE DADOS!B22)' },
  { name: 'Valor Km Deslocamento Caminhao Vazio', code: 'VALOR_KM_DESLOCAMENTO_VAZIO', value: 7.39, unit: 'R$/km', category: 'Logística', description: 'Valor por km de deslocamento do caminhão vazio (BANCO DE DADOS!B22)' },
  { name: 'Valor Km Deslocamento Prancha', code: 'VALOR_KM_DESLOCAMENTO_PRANCHA', value: 13.00, unit: 'R$/km', category: 'Logística', description: 'Valor do Km deslocamento caminhao prancha (BANCO DE DADOS!B28)' },
  { name: 'Valor Km Rodado Padrão', code: 'VALOR_KM_RODADO', value: 1.50, unit: 'R$/km', category: 'Logística', description: 'Valor base km rodado' },
  { name: 'Despesa Viagem ATV', code: 'DESPESA_VIAGEM_ATV', value: 251.25, unit: 'R$/viagem', category: 'Aplicação ATV', description: 'Despesa/viagem que cobre 5km (BANCO DE DADOS!B19)' },
  { name: 'ATV 1 Produto', code: 'ATV_1_PRODUTO', value: 315.00, unit: 'R$/Alq', category: 'Aplicação ATV', description: 'Valor/alq ATV para 1 produto (BANCO DE DADOS!B16)' },
  { name: 'ATV 2 Produtos', code: 'ATV_2_PRODUTOS', value: 310.00, unit: 'R$/Alq', category: 'Aplicação ATV', description: 'Valor/alq ATV para 2 produtos (BANCO DE DADOS!B17)' },
  { name: 'ATV 3 ou Mais Produtos', code: 'ATV_3_PRODUTOS', value: 300.00, unit: 'R$/Alq', category: 'Aplicação ATV', description: 'Valor/alq ATV para 3 ou mais produtos (BANCO DE DADOS!B18)' },
  { name: 'Valor Aplicacao Esterco', code: 'VALOR_APLICACAO_ESTERCO', value: 45.00, unit: 'R$/ton', category: 'Aplicação ATV', description: 'Aplicação Esterco R$/ton (BANCO DE DADOS!B24)' },
  { name: 'Diaria Pa Carregadeira', code: 'DIARIA_PA_CARREGADEIRA', value: 2400.00, unit: 'R$/dia', category: 'Equipamentos', description: 'Diária da Pá carregadeira (BANCO DE DADOS!B20)' },
  { name: 'Hora Pa Carregadeira', code: 'HORA_PA_CARREGADEIRA', value: 360.00, unit: 'R$/h', category: 'Equipamentos', description: 'Valor da hora da pá carregadeira (BANCO DE DADOS!B43)' },
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
  { name: 'AP Ate 50 Alqueires', code: 'AP_ATE_50_ALQ', value: 345.124551, unit: 'R$/Alq', category: 'Amostragem AP', description: 'R$/Alq AP até 50 alq (BANCO DE DADOS!B3)' },
  { name: 'AP 50 a 100 Alqueires', code: 'AP_50_A_100_ALQ', value: 325.589199, unit: 'R$/Alq', category: 'Amostragem AP', description: 'R$/Alq AP 50 a 100 alq (BANCO DE DADOS!B4)' },
  { name: 'AP Mais de 100 Alqueires', code: 'AP_MAIS_100_ALQ', value: 307.159622, unit: 'R$/Alq', category: 'Amostragem AP', description: 'R$/Alq AP mais de 100 alq (BANCO DE DADOS!B5)' },
  { name: 'Tier 1 AP Price', code: 'TIER_1_AP_PRICE', value: 345.124551, unit: 'R$/Alq', category: 'Amostragem AP', description: 'Preço base tier 1 AP' },
  { name: 'Reanalise Ate 50 Alqueires', code: 'REANALISE_ATE_50_ALQ', value: 330.124551, unit: 'R$/Alq', category: 'Amostragem AP', description: 'R$/Alq Reanálise até 50 alq (BANCO DE DADOS!C3)' },
  { name: 'Reanalise 50 a 100 Alqueires', code: 'REANALISE_50_A_100_ALQ', value: 311.438256, unit: 'R$/Alq', category: 'Amostragem AP', description: 'R$/Alq Reanálise 50 a 100 alq (BANCO DE DADOS!C4)' },
  { name: 'Reanalise Mais de 100 Alqueires', code: 'REANALISE_MAIS_100_ALQ', value: 293.809675, unit: 'R$/Alq', category: 'Amostragem AP', description: 'R$/Alq Reanálise mais de 100 alq (BANCO DE DADOS!C5)' },
  { name: 'Desconto Sem Formula Adubo', code: 'DESCONTO_SEM_FORMULA_ADUBO', value: 0.80, unit: 'fator', category: 'Amostragem AP', description: 'Fator de desconto se sem fórmula de adubo (BANCO DE DADOS!B6)' },
  { name: 'Valor Ponto Amostragem Solo', code: 'VALOR_PONTO_AMOSTRAGEM_SOLO', value: 40.00, unit: 'R$/ponto', category: 'Amostragem AP', description: 'Valor por ponto de amostragem de solo' },
  { name: 'Valor Ha Compactacao', code: 'VALOR_HA_COMPACTACAO', value: 25.00, unit: 'R$/ha', category: 'Compactação de Solo', description: 'Valor por hectare compactação' },
  { name: 'Valor Diaria Geral', code: 'VALOR_DIARIA', value: 150.00, unit: 'R$/dia', category: 'Geral', description: 'Valor diária geral de campo' },
  { name: 'Taxa Depreciacao Equipamento', code: 'TAXA_DEPREC_EQUIP', value: 0.10, unit: 'taxa', category: 'Equipamentos', description: 'Taxa de depreciação de equipamento' },
  { name: 'Custo Analise Macro', code: 'CUSTO_ANALISE_MACRO', value: 45.00, unit: 'R$/análise', category: 'Laboratório', description: 'Custo de referência análise macro' },
  { name: 'Custo Analise Fisica', code: 'CUSTO_ANALISE_FISICA', value: 25.00, unit: 'R$/análise', category: 'Laboratório', description: 'Custo de referência análise física' },
  { name: 'Juros Coleta Foliar Percentual', code: 'JUROS_FOLIAR_PERCENTUAL', value: 3.0, unit: '%/mês', category: 'Coleta Foliar', description: 'Taxa de juros para pagamento a prazo em Coleta Foliar (INPUT FOLHA!F2 = 3% a.m.)' },
  { name: 'Fator Sem Nota Fiscal Padrão', code: 'FATOR_SEM_NOTA_FISCAL', value: 0.93, unit: 'fator', category: 'Fiscal', description: 'Fator multiplicador do valor quando o cliente não solicita NF (0.93 = 7% desconto)' },
  { name: 'Equaliza Custo Fungo Nematoide', code: 'EQUALIZA_CUSTO_FUNGO_NEMA', value: 30.00, unit: 'R$/Alq', category: 'Equalização de Serviços', description: 'Custo unitário por alqueire para Mapeamento de Fungo e Nematóide no Equaliza' },
  { name: 'Equaliza Escalonamento Anual', code: 'EQUALIZA_ESCALONAMENTO_ANUAL_PERCENTUAL', value: 15.00, unit: '%/ano', category: 'Equalização de Serviços', description: 'Percentual de escalonamento anual de custos em contratos plurianuais (15% a.a.)' },
  { name: 'Equaliza Fator Folha', code: 'EQUALIZA_FATOR_FOLHA', value: 0.10, unit: 'fator', category: 'Equalização de Serviços', description: 'Fator multiplicador do valor folha no Equaliza (padrão 0.1)' },
  { name: 'Equaliza Fator Conferencia', code: 'EQUALIZA_FATOR_CONFERENCIA', value: 8.00, unit: 'fator', category: 'Equalização de Serviços', description: 'Fator multiplicador de alqueires/visitas para conferência no Equaliza (padrão 8.0)' },
  { name: 'Drone Pulverização Fator Sólido', code: 'DRONE_FATOR_SOLIDO', value: 0.90, unit: 'fator', category: 'Drone Pulverização', description: 'Fator multiplicador para aplicação sólida com drone (BANCO DE DADOS!B38 = 0,90)' },
  { name: 'ATV Desconto Sem NF', code: 'ATV_DESCONTO_SEM_NF_PERCENTUAL', value: 4.00, unit: '%', category: 'Aplicação ATV', description: 'Percentual de desconto para aplicação ATV sem Nota Fiscal (padrão 4%)' },
  { name: 'ATV Carga Caminhão Esterco', code: 'ATV_CAPACIDADE_CAMINHAO_ESTERCO', value: 8.50, unit: 'Ton/carga', category: 'Aplicação ATV', description: 'Capacidade média de carga do caminhão para esterco / cama de frango (padrão 8.5 ton)' },
  { name: 'ATV Carga Caminhão Padrão', code: 'ATV_CAPACIDADE_CAMINHAO_PADRAO', value: 13.00, unit: 'Ton/carga', category: 'Aplicação ATV', description: 'Capacidade média de carga do caminhão para calcário, gesso e fertilizantes (padrão 13 ton)' },
  { name: 'ATV Rendimento Diário Esterco', code: 'ATV_RENDIMENTO_ESTERCO_DIA', value: 200.00, unit: 'Ton/dia', category: 'Aplicação ATV', description: 'Rendimento operacional diário por caminhão para esterco / cama de frango (padrão 200 ton/dia)' },
  { name: 'ATV Rendimento Diário Padrão', code: 'ATV_RENDIMENTO_PADRAO_DIA', value: 28.00, unit: 'Alq/dia', category: 'Aplicação ATV', description: 'Rendimento operacional diário por caminhão em alqueires para produtos padrão (padrão 28 alq/dia)' },
  { name: 'Percentual Análise Completa com Desconto', code: 'PERC_COMPLETA_COM_DESCONTO_PADRAO', value: 40.00, unit: '%', category: 'Amostragem AP', description: 'Percentual padrão de análises completas quando há desconto comercial no pedido (padrão 40%)' },
];

const initialServices = [
  { name: 'Conferência', status: 'Ativo', is_fixed: true, value_per_alqueire: '71.67' },
  { name: 'Coleta Foliar', status: 'Ativo', is_fixed: true, value_per_alqueire: '18.00' },
  { name: 'Compactação de Solo', status: 'Ativo', is_fixed: true, value_per_alqueire: '25.00' },
  { name: 'Voo de Drone (Mapeamento)', status: 'Ativo', is_fixed: true, value_per_alqueire: '50.00' },
  { name: 'Aplicação ATV', status: 'Ativo', is_fixed: true, value_per_alqueire: '315.00' },
  { name: 'Amostragem de Solo (AP)', status: 'Ativo', is_fixed: true, value_per_alqueire: '345.12' },
  { name: 'Pulverização Drone', status: 'Ativo', is_fixed: true, value_per_alqueire: '240.00' },
  { name: 'Equalização de Serviços', status: 'Ativo', is_fixed: true, value_per_alqueire: '0.00' },
];

const initialProducts = [
  {
    name: 'Calcário Dolomítico',
    code: 'CALC-DOL',
    category: 'Corretivo',
    unit: 'Ton',
    cost_price: 110.00,
    price: 175.00,
    quantity: 0.00,
    min_stock: 0.00,
    controls_stock: false,
    supplier: 'Mineração Bela Vista',
    status: 'Ativo',
    description: 'Corretivo de solo aplicado via serviço ATV (fornecido pelo produtor). Sem estoque físico mantido pela Preciza.',
  },
  {
    name: 'Calcário Calcítico',
    code: 'CALC-CAL',
    category: 'Corretivo',
    unit: 'Ton',
    cost_price: 120.00,
    price: 185.00,
    quantity: 0.00,
    min_stock: 0.00,
    controls_stock: false,
    supplier: 'Mineração Bela Vista',
    status: 'Ativo',
    description: 'Corretivo com predominância de Cálcio aplicado via ATV (fornecido pelo produtor). Sem estoque físico mantido pela Preciza.',
  },
  {
    name: 'Gesso Agrícola',
    code: 'GES-AGR',
    category: 'Corretivo',
    unit: 'Ton',
    cost_price: 85.00,
    price: 135.00,
    quantity: 0.00,
    min_stock: 0.00,
    controls_stock: false,
    supplier: 'Fospar Fertilizantes',
    status: 'Ativo',
    description: 'Condicionador de subsolo aplicado via serviço ATV (fornecido pelo produtor). Sem estoque físico mantido pela Preciza.',
  },
  {
    name: 'Cama de Frango',
    code: 'CAM-FRA',
    category: 'Corretivo',
    unit: 'Ton',
    cost_price: 75.00,
    price: 120.00,
    quantity: 0.00,
    min_stock: 0.00,
    controls_stock: false,
    supplier: 'Granja Esperança',
    status: 'Ativo',
    description: 'Matéria orgânica rica em nutrientes aplicada via ATV (fornecido pelo produtor). Sem estoque físico mantido pela Preciza.',
  },
  {
    name: 'Pó de Rocha',
    code: 'PO-ROC',
    category: 'Corretivo',
    unit: 'Ton',
    cost_price: 65.00,
    price: 105.00,
    quantity: 0.00,
    min_stock: 0.00,
    controls_stock: false,
    supplier: 'Mineração Planalto',
    status: 'Ativo',
    description: 'Remineralizador de solo aplicado via serviço ATV (fornecido pelo produtor). Sem estoque físico mantido pela Preciza.',
  },
  {
    name: 'KCl (Cloreto de Potássio)',
    code: 'FERT-KCL',
    category: 'Fertilizante',
    unit: 'Ton',
    cost_price: 2750.00,
    price: 3450.00,
    quantity: 0.00,
    min_stock: 0.00,
    controls_stock: false,
    supplier: 'Mosaic Fertilizantes',
    status: 'Ativo',
    description: 'Fertilizante potássico aplicado a taxa variável (fornecido pelo produtor). Sem estoque físico mantido pela Preciza.',
  },
  {
    name: 'Superfosfato Simples (SSP)',
    code: 'FERT-SSP',
    category: 'Fertilizante',
    unit: 'Ton',
    cost_price: 1550.00,
    price: 2150.00,
    quantity: 0.00,
    min_stock: 0.00,
    controls_stock: false,
    supplier: 'Yara Brasil',
    status: 'Ativo',
    description: 'Fonte de Fósforo solúvel para arranque radicular (fornecido pelo produtor). Sem estoque físico mantido pela Preciza.',
  },
  {
    name: 'Ureia Agrícola 46% N',
    code: 'FERT-URE',
    category: 'Fertilizante',
    unit: 'Ton',
    cost_price: 2250.00,
    price: 2950.00,
    quantity: 0.00,
    min_stock: 0.00,
    controls_stock: false,
    supplier: 'Fertipar',
    status: 'Ativo',
    description: 'Adubo nitrogenado de alta concentração (fornecido pelo produtor). Sem estoque físico mantido pela Preciza.',
  },
  {
    name: 'Adjuvante Espalhante Adesivo',
    code: 'ADJ-ESP',
    category: 'Adjuvante',
    unit: 'L',
    cost_price: 42.00,
    price: 78.00,
    quantity: 150.00,
    min_stock: 20.00,
    controls_stock: true,
    supplier: 'AgroQuímica Sul',
    status: 'Ativo',
    description: 'Reduz tensão superficial da gota. Estoque físico mantido pela Preciza para pulverização.',
  },
  {
    name: 'Biológico Trichoderma Harzianum',
    code: 'BIO-TRI',
    category: 'Biológico',
    unit: 'L',
    cost_price: 85.00,
    price: 165.00,
    quantity: 90.00,
    min_stock: 15.00,
    controls_stock: true,
    supplier: 'BioAgro Soluções',
    status: 'Ativo',
    description: 'Inoculante biológico protetor contra fungos de solo. Estoque próprio mantido pela Preciza.',
  },
];

const serviceProductLinks: { serviceName: string; productNames: string[] }[] = [
  {
    serviceName: 'Aplicação ATV',
    productNames: [
      'Calcário Dolomítico',
      'Calcário Calcítico',
      'Gesso Agrícola',
      'Cama de Frango',
      'Pó de Rocha',
      'KCl (Cloreto de Potássio)',
      'Superfosfato Simples (SSP)',
    ],
  },
  {
    serviceName: 'Pulverização Drone',
    productNames: [
      'Adjuvante Espalhante Adesivo',
      'Biológico Trichoderma Harzianum',
    ],
  },
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

    // 3. Seed Products
    const productRepo = connection.getRepository(Product);
    console.log(`🌾 Seeding ${initialProducts.length} Agricultural Products...`);
    const savedProducts: Map<string, Product> = new Map();

    for (const p of initialProducts) {
      let existing = await productRepo.findOne({ where: { name: p.name } });
      if (existing) {
        Object.assign(existing, p);
        await productRepo.save(existing);
        savedProducts.set(existing.name, existing);
      } else {
        const created = productRepo.create(p);
        await productRepo.save(created);
        savedProducts.set(created.name, created);
      }
    }
    console.log('✅ Agricultural Products seeded successfully.');

    // 4. Link Products to Services
    const spRepo = connection.getRepository(ServiceProduct);
    console.log(`🔗 Linking Products to Services...`);
    for (const link of serviceProductLinks) {
      const service = await serviceRepo.findOne({ where: { name: link.serviceName } });
      if (!service) continue;

      // Clear existing links
      await spRepo.delete({ service_id: service.id });

      const newLinks: ServiceProduct[] = [];
      const linkedNames: string[] = [];

      for (const prodName of link.productNames) {
        const product = savedProducts.get(prodName) || (await productRepo.findOne({ where: { name: prodName } }));
        if (product) {
          newLinks.push(
            spRepo.create({
              service_id: service.id,
              product_id: product.id,
              is_default: true,
            })
          );
          linkedNames.push(product.name);
        }
      }

      if (newLinks.length > 0) {
        await spRepo.save(newLinks);
        await serviceRepo.update(service.id, { products: linkedNames.join(', ') });
        console.log(`  ✓ Linked ${newLinks.length} products to "${service.name}"`);
      }
    }
    console.log('✅ Service-Product links established successfully.');

    // 5. Seed Plots for Farms and synchronize orders
    const farmRepo = connection.getRepository(Farm);
    const plotRepo = connection.getRepository(Plot);
    const orderRepo = connection.getRepository(Order);
    const allFarms = await farmRepo.find();
    for (const f of allFarms) {
      let plots = await plotRepo.find({ where: { farm_id: f.id } });
      if (plots.length === 0) {
        const areaTotal = Number(f.area) || 24.2;
        const h1 = Math.round((areaTotal / 2) * 100) / 100;
        const h2 = Math.round((areaTotal - h1) * 100) / 100;
        const p1 = plotRepo.create({ farm_id: f.id, name: 'Talhão 01 - Sede', area: h1, status: 'Ativo' });
        const p2 = plotRepo.create({ farm_id: f.id, name: 'Talhão 02 - Pivô Central', area: h2, status: 'Ativo' });
        plots = await plotRepo.save([p1, p2]);
        console.log(`🌾 Plots seeded for farm "${f.name}":`, plots.map(p => p.name));
      }

      // Synchronize orders of this farm
      const orders = await orderRepo.find({ where: { farm_id: f.id } });
      for (const ord of orders) {
        if (!ord.plots || ord.plots.length === 0) {
          ord.plots = plots.map(p => ({ id: p.id, name: p.name, area: Number(p.area) }));
          await orderRepo.save(ord);
          console.log(`  ✓ Synced ${plots.length} plots into order ${ord.id}`);
        }
      }
    }

    // 6. Seed Default Admin Users
    const userRepo = connection.getRepository(User);
    const adminEmails = [
      { email: 'admin@farmflow.com', name: 'Administrador FarmFlow' },
      { email: 'admin@preciza.com.br', name: 'Administrador Preciza' },
    ];
    for (const adminUser of adminEmails) {
      let admin = await userRepo.findOne({ where: { email: adminUser.email } });
      if (!admin) {
        const hashedPassword = await hash('admin123', 8);
        admin = userRepo.create({
          name: adminUser.name,
          email: adminUser.email,
          password: hashedPassword,
          role: 'admin',
        });
        await userRepo.save(admin);
        console.log(`👤 Admin user created: ${adminUser.email} / admin123`);
      } else {
        console.log(`👤 Admin user already exists: ${adminUser.email}`);
      }
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
