import { describe, it, expect } from 'vitest';
import { ConferenciaService, CostVariable } from './ConferenciaService';

const mockCostVariables: CostVariable[] = [
  { id: '1', name: 'Valor Alqueire Conferencia', code: 'VALOR_ALQ_CONFERENCIA', value: 65, description: '' },
  { id: '2', name: 'Valor Ponto Confere Compactacao', code: 'VALOR_PONTO_CONFERE_COMPACTACAO', value: 430, description: '' },
  { id: '3', name: 'Juros Pagamento Prazo Percentual', code: 'JUROS_PAGAMENTO_PRAZO_PERCENTUAL', value: 1.5, description: '' },
  { id: '4', name: 'Analise 20-40 CM Valor Analise', code: 'ANALISE_20_40_CM_VALOR_ANALISE', value: 70, description: '' },
  { id: '5', name: 'Data Base Calculo Juro', code: 'DATA_BASE_CALCULO_JURO', value: 20241231, description: '' },
  { id: '6', name: 'Valor Analise Nova Area', code: 'VALOR_ANALISE_NOVA_AREA', value: 52.3, description: '' },
  { id: '7', name: 'Valor Analise Adubo Base', code: 'VALOR_ANALISE_ADUBO_BASE', value: 35.3, description: '' },
  { id: '8', name: 'Valor Analise Enxofre', code: 'VALOR_ANALISE_ENXOFRE', value: 17.7, description: '' },
  { id: '9', name: 'Valor Analise Fisica Unitario', code: 'VALOR_ANALISE_FISICA_UNITARIO', value: 42.3, description: '' },
  { id: '10', name: 'Valor KM Conferencia Folha Calculado', code: 'VALOR_KM_CONFERENCIA_FOLHA_CALCULADO', value: 4.957983193277311, description: '' },
];

describe('ConferenciaService', () => {
  it('should calculate exact values matching budget.xlsm (INPUT CONFERENCIA row 9 and E30)', () => {
    const service = new ConferenciaService(mockCostVariables);

    const result = service.calculate({
      clienteDesejaNotaFiscal: 'S',
      distanciaFazendaKm: 20,
      vencimentoServico: '30/03/2026',
      desejaAnaliseFisica: 'N',
      percentualAnalises20_40cm: 10, // 10%
      alqueires: 8.2,
      numAnalises: 10,
      totalAlqueires: 8.2,
    });

    // In budget.xlsm:
    // E30 = 5645.899579675308 (R$ 5.645,90)
    // E31 = 688.5243389847938 (R$ 688,52/alq)
    // E32 = 564.5899579675308 (R$ 564,59/ponto)
    expect(result.totalValue).toBeCloseTo(5645.90, 2);
    expect(result.totalValuePerAlq).toBeCloseTo(688.52, 2);
    expect(result.totalValuePerPoint).toBeCloseTo(564.59, 2);

    // Verify detailed components
    expect(result.details.jurosFactor).toBeCloseTo(1.252716, 4);
    expect(result.details.numAnalises20_40cm).toBe(1);
    expect(result.details.custoAnalises20_40cm).toBe(135.00); // 1 * (70 + 65)
    expect(result.details.travelCost).toBeCloseTo(99.16, 2);
    expect(result.details.selectedCostMethod).toBeCloseTo(4399.16, 2); // Method 2: 10 * 430 + 99.16
    expect(result.details.custoTalhaoCalculated).toBeCloseTo(5510.90, 2);

    // Verify invoice breakdown matching PEDIDO CONFERENCIA
    expect(result.details.breakdown.analiseMacroUnit).toBeCloseTo(105.30, 2); // 52.3 + 35.3 + 17.7
    expect(result.details.breakdown.analiseMacroTotal).toBeCloseTo(1053.00, 2); // 10 * 105.30
    expect(result.details.breakdown.analise20_40Unit).toBeCloseTo(70.00, 2);
    expect(result.details.breakdown.analise20_40Total).toBeCloseTo(70.00, 2);
    expect(result.details.breakdown.coletaServicoTotal).toBeCloseTo(4522.90, 2); // 5645.90 - 1053.00 - 70.00
    expect(result.details.breakdown.coletaServicoPerAlq).toBeCloseTo(551.57, 2); // 4522.90 / 8.2
  });

  it('should produce the same total value whether Nota Fiscal is S or N (matching Excel)', () => {
    const service = new ConferenciaService(mockCostVariables);

    const withNF = service.calculate({
      clienteDesejaNotaFiscal: 'S',
      distanciaFazendaKm: 20,
      vencimentoServico: '30/03/2026',
      desejaAnaliseFisica: 'N',
      percentualAnalises20_40cm: 10,
      alqueires: 8.2,
      numAnalises: 10,
      totalAlqueires: 8.2,
    });

    const withoutNF = service.calculate({
      clienteDesejaNotaFiscal: 'N',
      distanciaFazendaKm: 20,
      vencimentoServico: '30/03/2026',
      desejaAnaliseFisica: 'N',
      percentualAnalises20_40cm: 10,
      alqueires: 8.2,
      numAnalises: 10,
      totalAlqueires: 8.2,
    });

    expect(withNF.totalValue).toBeCloseTo(withoutNF.totalValue, 4);
  });

  it('should adjust physical analysis unit price in breakdown when desejaAnaliseFisica is S', () => {
    const service = new ConferenciaService(mockCostVariables);

    const result = service.calculate({
      clienteDesejaNotaFiscal: 'S',
      distanciaFazendaKm: 20,
      vencimentoServico: '30/03/2026',
      desejaAnaliseFisica: 'S',
      percentualAnalises20_40cm: 10,
      alqueires: 8.2,
      numAnalises: 10,
      totalAlqueires: 8.2,
    });

    // 105.30 + 42.30 = 147.60
    expect(result.details.breakdown.analiseMacroUnit).toBeCloseTo(147.60, 2);
    expect(result.details.breakdown.analiseMacroTotal).toBeCloseTo(1476.00, 2);
  });

  it('should derive valorKm dynamically when VALOR_OLEO_DIESEL is provided', () => {
    const variablesWithDiesel: CostVariable[] = [
      ...mockCostVariables,
      { id: '11', name: 'Valor Oleo Diesel', code: 'VALOR_OLEO_DIESEL', value: 6.9411764705882355, description: '' },
    ];

    const service = new ConferenciaService(variablesWithDiesel);
    const result = service.calculate({
      clienteDesejaNotaFiscal: 'S',
      distanciaFazendaKm: 20,
      vencimentoServico: '30/03/2026',
      desejaAnaliseFisica: 'N',
      percentualAnalises20_40cm: 10,
      alqueires: 8.2,
      numAnalises: 10,
      totalAlqueires: 8.2,
    });

    // Excel formula: =(B25 / 7 * 2 * 2.5) = 4.957983...
    expect(result.details.valorKmCalculated).toBeCloseTo(4.957983, 4);
    expect(result.totalValue).toBeCloseTo(5645.90, 2);
  });

  it('should recalculate when diesel price increases', () => {
    const originalService = new ConferenciaService([
      ...mockCostVariables,
      { id: '11', name: 'Valor Oleo Diesel', code: 'VALOR_OLEO_DIESEL', value: 6.94, description: '' },
    ]);

    const higherDieselService = new ConferenciaService([
      ...mockCostVariables,
      { id: '11', name: 'Valor Oleo Diesel', code: 'VALOR_OLEO_DIESEL', value: 8.50, description: '' },
    ]);

    const resOriginal = originalService.calculate({
      clienteDesejaNotaFiscal: 'S',
      distanciaFazendaKm: 50,
      vencimentoServico: '30/03/2026',
      desejaAnaliseFisica: 'N',
      percentualAnalises20_40cm: 10,
      alqueires: 10,
      numAnalises: 10,
      totalAlqueires: 10,
    });

    const resHigher = higherDieselService.calculate({
      clienteDesejaNotaFiscal: 'S',
      distanciaFazendaKm: 50,
      vencimentoServico: '30/03/2026',
      desejaAnaliseFisica: 'N',
      percentualAnalises20_40cm: 10,
      alqueires: 10,
      numAnalises: 10,
      totalAlqueires: 10,
    });

    expect(resHigher.details.valorKmCalculated).toBeGreaterThan(resOriginal.details.valorKmCalculated);
    expect(resHigher.details.travelCost).toBeGreaterThan(resOriginal.details.travelCost);
    expect(resHigher.totalValue).toBeGreaterThan(resOriginal.totalValue);
  });
});
