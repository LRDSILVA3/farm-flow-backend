import { describe, it, expect } from 'vitest';
import { SoilSamplingService } from './SoilSamplingService';
import { CostVariable } from './ConferenciaService';

const mockCostVariables: CostVariable[] = [
  { id: '1', name: 'AP Ate 50 Alqueires', code: 'AP_ATE_50_ALQ', value: 295, description: '' },
  { id: '2', name: 'AP 50 a 100 Alqueires', code: 'AP_50_A_100_ALQ', value: 278.3018867924528, description: '' },
  { id: '3', name: 'AP Mais de 100 Alqueires', code: 'AP_MAIS_100_ALQ', value: 262.5489498042008, description: '' },
  { id: '4', name: 'Valor Ponto Confere Compactacao', code: 'VALOR_PONTO_CONFERE_COMPACTACAO', value: 430, description: '' },
  { id: '5', name: 'Valor Analise Nova Area', code: 'VALOR_ANALISE_NOVA_AREA', value: 52.3, description: '' },
  { id: '6', name: 'Valor Analise Adubo Base', code: 'VALOR_ANALISE_ADUBO_BASE', value: 35.3, description: '' },
  { id: '7', name: 'Valor Analise Enxofre', code: 'VALOR_ANALISE_ENXOFRE', value: 17.7, description: '' },
  { id: '8', name: 'Valor Analise Micronutrientes', code: 'VALOR_ANALISE_MICRONUTRIENTES', value: 20, description: '' },
  { id: '9', name: 'Analise 20-40 CM Valor Analise', code: 'ANALISE_20_40_CM_VALOR_ANALISE', value: 70, description: '' },
  { id: '10', name: 'Valor Analise Fisica Unitario', code: 'VALOR_ANALISE_FISICA_UNITARIO', value: 42.3, description: '' },
  { id: '11', name: 'Juros Pagamento Prazo Percentual', code: 'JUROS_PAGAMENTO_PRAZO_PERCENTUAL', value: 1.5, description: '' },
  { id: '12', name: 'Data Base Calculo Juro', code: 'DATA_BASE_CALCULO_JURO', value: 20241231, description: '' },
];

describe('SoilSamplingService', () => {
  it('should calculate exact values matching user Excel screenshot (LucasRafael.xlsm - R$ 5.249,52 Sugerido / R$ 4.987,04 Fechado)', () => {
    // 2026 production variables from database / LucasRafael.xlsm
    const service2026 = new SoilSamplingService([
      { id: '1', code: 'AP_ATE_50_ALQ', name: 'AP Ate 50 Alq', value: 345.124551, description: '' },
      { id: '2', code: 'VALOR_PONTO_CONFERE_COMPACTACAO', name: 'Valor Ponto Confere', value: 361.111111, description: '' },
      { id: '3', code: 'VALOR_ANALISE_NOVA_AREA', name: 'Valor Analise Nova Area', value: 61.40, description: '' },
      { id: '4', code: 'VALOR_ANALISE_ADUBO_BASE', name: 'Valor Analise Adubo Base', value: 17.50, description: '' },
      { id: '5', code: 'VALOR_ANALISE_ENXOFRE', name: 'Valor Analise Enxofre', value: 12.50, description: '' },
      { id: '6', code: 'VALOR_ANALISE_MICRONUTRIENTES', name: 'Valor Analise Micro', value: 29.55, description: '' },
      { id: '7', code: 'ANALISE_20_40_CM_VALOR_ANALISE', name: 'Analise 20-40cm', value: 73.90, description: '' },
      { id: '8', code: 'VALOR_ANALISE_FISICA_UNITARIO', name: 'Analise Fisica', value: 33.30, description: '' },
      { id: '9', code: 'DATA_BASE_CALCULO_JURO', name: 'Data Base Calculo Juro', value: 20251231, description: '' },
      { id: '10', code: 'JUROS_PAGAMENTO_PRAZO_PERCENTUAL', name: 'Juros', value: 1.2, description: '' },
      { id: '11', code: 'DESCONTO_SEM_FORMULA_ADUBO', name: 'Desconto Sem Adubo', value: 0.8, description: '' },
    ]);

    // Exact input from User's Screenshot 1:
    // Nova Área (isReanalise = false)
    // Sem Nota Fiscal (comNotaFiscal = false)
    // Area: 10.0 alq
    // Pontos: 9
    // Vencimento: 01/12/2026
    // Determinações: Adubação Corretiva (ON), Adubo Base (ON), Enxofre (ON), Micronutrientes (OFF), 20-40cm (ON), Física (ON)
    // Desconto Comercial: 5%
    const result = service2026.calculate({
      isReanalise: false,
      comNotaFiscal: false,
      alqueires: 10,
      numPontos: 9,
      vencimentoServico: '01/12/2026',
      desejaAduboBase: true,
      desejaEnxofre: true,
      desejaMicronutrientes: false,
      desejaAnalise20_40cm: true,
      desejaAnaliseFisica: true,
      descontoPercentualManual: 5,
    });

    // Check all fields against Excel screenshot:
    expect(result.details.jurosFactor).toBe(1.142); // Cell D10: Correção 1,142
    expect(result.details.precoAlqServico).toBeCloseTo(366.70, 2); // Cell B12: R$/alq - Serviço R$ 366,70
    expect(result.details.totalServicoAlq).toBeCloseTo(3666.97, 2); // Cell C12: R$ 3.666,97
    expect(result.details.valorTeoricoAnaliseUnit).toBeCloseTo(103.31, 2); // Cell B7: Valor da Análise R$ 103,31
    expect(result.valorTotalSugerido).toBeCloseTo(5249.52, 2); // Cell B8: Valor Total Sugerido R$ 5.249,52
    expect(result.desconto).toBeCloseTo(262.48, 2); // 5% discount
    expect(result.descontoPercentual).toBeCloseTo(5.0, 2); // Desconto de -5%
    expect(result.totalValue).toBeCloseTo(4987.04, 2); // Cell B9: Valor total fechado R$ 4.987,04
    expect(result.totalValuePerAlq).toBeCloseTo(498.70, 2); // Cell B11: R$/alq total R$ 498,70
    expect(result.sugeridoPerAlq).toBeCloseTo(524.95, 2); // Sugerido per alq R$ 524,95
    expect(result.totalValuePerPoint).toBeCloseTo(554.12, 2); // R$/ponto fechado R$ 554,12
    expect(result.details.numAnalisesCompleta).toBe(3); // Quadro: 3 completas
    expect(result.details.numAnalisesMacro).toBe(6); // Quadro: 6 macro
    expect(result.details.numAnalises20_40cm).toBe(1); // Quadro: 1 20-40cm
    expect(result.details.numAnalisesFisicas).toBe(1); // Quadro: 1 física
  });

  it('should calculate suggested total matching INPUT DADOS cell B8 in LucasRafael.xlsm', () => {
    const service = new SoilSamplingService(mockCostVariables);

    const result = service.calculate({
      isReanalise: false,
      comNotaFiscal: true,
      alqueires: 50,
      numPontos: 41,
      vencimentoServico: '30/06/2025',
      desejaAduboBase: true,
      desejaEnxofre: true,
      desejaMicronutrientes: true,
      desejaAnalise20_40cm: true,
      desejaAnaliseFisica: false,
    });

    expect(result.details.numMinimoAnalises).toBe(41);
    expect(result.details.numAnalises20_40cm).toBe(4);
    expect(result.details.valorUnitarioAnalise).toBeCloseTo(125.30, 2);
    expect(result.details.precoAlqServico).toBeCloseTo(304.46, 2);
    expect(result.details.totalServicoAlq).toBeCloseTo(15222.92, 2);
    expect(result.valorTotalSugerido).toBeCloseTo(22580.40, 1);
    expect(result.sugeridoPerAlq).toBeCloseTo(451.61, 2);
    expect(result.totalValue).toBeCloseTo(22580.40, 1);
  });

  it('should calculate closed budget with discount', () => {
    const service = new SoilSamplingService(mockCostVariables);

    const result = service.calculate({
      isReanalise: false,
      comNotaFiscal: true,
      alqueires: 50,
      numPontos: 41,
      vencimentoServico: '30/06/2025',
      desejaAduboBase: true,
      desejaEnxofre: true,
      desejaMicronutrientes: true,
      desejaAnalise20_40cm: true,
      desejaAnaliseFisica: false,
      descontoManual: 1319.88,
    });

    expect(result.valorTotalSugerido).toBeCloseTo(22580.40, 1);
    expect(result.desconto).toBeCloseTo(1319.88, 2);
    expect(result.totalValue).toBeCloseTo(21260.52, 1);
  });

  it('should calculate closed budget specifying valorFechadoManual directly', () => {
    const service = new SoilSamplingService(mockCostVariables);

    const result = service.calculate({
      isReanalise: false,
      comNotaFiscal: true,
      alqueires: 50,
      numPontos: 41,
      vencimentoServico: '30/06/2025',
      desejaAduboBase: true,
      desejaEnxofre: true,
      desejaMicronutrientes: true,
      desejaAnalise20_40cm: true,
      desejaAnaliseFisica: false,
      valorFechadoManual: 20000.00,
    });

    expect(result.valorTotalSugerido).toBeCloseTo(22580.40, 1);
    expect(result.totalValue).toBeCloseTo(20000.00, 2);
    expect(result.desconto).toBeCloseTo(2580.40, 1);
  });

  it('should calculate à vista without interest when vencimento is omitted', () => {
    const service = new SoilSamplingService(mockCostVariables);

    const result = service.calculate({
      isReanalise: false,
      comNotaFiscal: true,
      alqueires: 50,
      numPontos: 41,
      desejaAduboBase: true,
      desejaEnxofre: true,
      desejaMicronutrientes: true,
      desejaAnalise20_40cm: true,
      desejaAnaliseFisica: false,
    });

    expect(result.details.jurosFactor).toBe(1.0);
    expect(result.details.precoAlqServico).toBeCloseTo(278.30, 2);
    expect(result.details.totalServicoAlq).toBeCloseTo(13915.09, 2);
    expect(result.valorTotalSugerido).toBeCloseTo(19332.39, 1);
  });

  it('should return zero total and zero 20-40cm analyses when area or points are zero', () => {
    const service = new SoilSamplingService(mockCostVariables);

    const result = service.calculate({
      isReanalise: false,
      comNotaFiscal: true,
      alqueires: 0,
      numPontos: 0,
      desejaAduboBase: true,
      desejaEnxofre: true,
      desejaMicronutrientes: true,
      desejaAnalise20_40cm: true,
      desejaAnaliseFisica: false,
    });

    expect(result.details.numAnalises20_40cm).toBe(0);
    expect(result.valorTotalSugerido).toBe(0);
    expect(result.totalValue).toBe(0);
  });

  it('should calculate discount automatically when default cost variable is present', () => {
    const varsWithDefaultDiscount = [
      ...mockCostVariables,
      { id: '100', code: 'DESCONTO_COMERCIAL_PADRAO_PERCENTUAL', name: 'Desconto Comercial Padrao', value: 5.0, description: '' }
    ];
    const service = new SoilSamplingService(varsWithDefaultDiscount);
    const result = service.calculate({
      isReanalise: false,
      comNotaFiscal: true,
      alqueires: 50,
      numPontos: 41,
      vencimentoServico: '30/06/2025',
    });

    expect(result.valorTotalSugerido).toBeCloseTo(22580.40, 1);
    expect(result.descontoPercentual).toBeCloseTo(5.0, 2);
    expect(result.desconto).toBeCloseTo(22580.40 * 0.05, 1);
    expect(result.totalValue).toBeCloseTo(22580.40 * 0.95, 1);
  });

  it('should calculate discount when descontoPercentualManual is passed', () => {
    const service = new SoilSamplingService(mockCostVariables);
    const result = service.calculate({
      isReanalise: false,
      comNotaFiscal: true,
      alqueires: 50,
      numPontos: 41,
      vencimentoServico: '30/06/2025',
      descontoPercentualManual: 5,
    });

    expect(result.valorTotalSugerido).toBeCloseTo(22580.40, 1);
    expect(result.descontoPercentual).toBeCloseTo(5.0, 1);
    expect(result.totalValue).toBeCloseTo(22580.40 * 0.95, 1);
  });

  it('should use 2026 defaults and calculate correctly with 2026 parameters', () => {
    const service2026 = new SoilSamplingService([]);
    const result = service2026.calculate({
      isReanalise: false,
      comNotaFiscal: true,
      alqueires: 50,
      numPontos: 41,
      desejaAduboBase: true,
      desejaEnxofre: true,
      desejaMicronutrientes: false,
      desejaAnalise20_40cm: true,
      desejaAnaliseFisica: false,
    });

    // 2026 AP 50-100: 325.589199
    expect(result.details.precoAlqServico).toBeCloseTo(325.59, 2);
    expect(result.details.valorUnitarioAnalise).toBeCloseTo(91.40, 2); // 61.40 + 17.50 + 12.50
    expect(result.details.numAnalises20_40cm).toBe(4);
  });

  it('should apply 20% discount (0.8 factor) when desejaAduboBase is false', () => {
    const service2026 = new SoilSamplingService([]);
    const result = service2026.calculate({
      isReanalise: false,
      comNotaFiscal: true,
      alqueires: 50,
      numPontos: 41,
      desejaAduboBase: false,
    });

    // Without adubo base: 325.589199 * 0.8 = 260.47
    expect(result.details.precoAlqServico).toBeCloseTo(325.589199 * 0.8, 2);
  });
});
