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
  it('should calculate suggested total matching INPUT DADOS cell B8 in budget.xlsm', () => {
    const service = new SoilSamplingService(mockCostVariables);

    // In budget.xlsm INPUT DADOS:
    // alqueires = 50, numPontos = 41
    // vencimento = 30/06/2025
    // comNotaFiscal = true, isReanalise = false
    // B8 = 20640.22
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
    expect(result.valorTotalSugerido).toBeCloseTo(20640.22, 1);
    expect(result.sugeridoPerAlq).toBeCloseTo(412.80, 2);
    expect(result.totalValue).toBeCloseTo(20640.22, 1);
  });

  it('should calculate closed budget with discount matching PEDIDO VIA CLIENTE (R$ 19.320,34)', () => {
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

    expect(result.valorTotalSugerido).toBeCloseTo(20640.22, 1);
    expect(result.sugeridoPerAlq).toBeCloseTo(412.80, 2);
    expect(result.desconto).toBeCloseTo(1319.88, 2);
    expect(result.descontoPercentual).toBeCloseTo(6.39, 1);
    expect(result.totalValue).toBeCloseTo(19320.34, 1);
    expect(result.totalValuePerAlq).toBeCloseTo(386.41, 2);
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
      valorFechadoManual: 19320.34,
    });

    expect(result.valorTotalSugerido).toBeCloseTo(20640.22, 1);
    expect(result.totalValue).toBeCloseTo(19320.34, 2);
    expect(result.desconto).toBeCloseTo(1319.88, 1);
    expect(result.descontoPercentual).toBeCloseTo(6.39, 1);
    expect(result.totalValuePerAlq).toBeCloseTo(386.41, 2);
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
});
