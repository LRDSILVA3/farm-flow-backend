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
  it('should calculate exact values matching user Excel screenshot (LucasRafael.xlsm - R$ 3.220,33 total / R$ 3.074,77 talhão)', () => {
    // Variables from LucasRafael.xlsm 2026
    const service2026 = new ConferenciaService([
      { id: '1', code: 'VALOR_ALQ_CONFERENCIA', name: 'Valor Alqueire Conferencia', value: 71.666667, description: '' },
      { id: '2', code: 'VALOR_PONTO_CONFERE_COMPACTACAO', name: 'Valor Ponto Confere Compactacao', value: 361.111111, description: '' },
      { id: '3', code: 'JUROS_PAGAMENTO_PRAZO_PERCENTUAL', name: 'Juros Pagamento Prazo Percentual', value: 1.2, description: '' },
      { id: '4', code: 'ANALISE_20_40_CM_VALOR_ANALISE', name: 'Analise 20-40 CM Valor Analise', value: 73.90, description: '' },
      { id: '5', code: 'DATA_BASE_CALCULO_JURO', name: 'Data Base Calculo Juro', value: 20251231, description: '' },
      { id: '6', code: 'VALOR_ANALISE_NOVA_AREA', name: 'Valor Analise Nova Area', value: 61.40, description: '' },
      { id: '7', code: 'VALOR_ANALISE_ADUBO_BASE', name: 'Valor Analise Adubo Base', value: 17.50, description: '' },
      { id: '8', code: 'VALOR_ANALISE_ENXOFRE', name: 'Valor Analise Enxofre', value: 12.50, description: '' },
      { id: '9', code: 'VALOR_ANALISE_FISICA_UNITARIO', name: 'Valor Analise Fisica Unitario', value: 33.30, description: '' },
      { id: '10', code: 'VALOR_OLEO_DIESEL', name: 'Valor Oleo Diesel', value: 8.375, description: '' },
      { id: '11', code: 'VALOR_LAB_BIOAS', name: 'Valor Lab BIOAS', value: 205.20, description: '' },
    ]);

    const result = service2026.calculate({
      clienteDesejaNotaFiscal: 'S',
      distanciaFazendaKm: 10,
      vencimentoServico: '01/12/2026',
      desejaAnaliseFisica: 'S',
      percentualAnalises20_40cm: 20, // 20%
      percentualAnalisesBIOAS: 10, // 10%
      alqueires: 10.0,
      numAnalises: 5,
      totalAlqueires: 10.0,
    });

    // In LucasRafael.xlsm:
    // Talhão 1 (E10): R$ 3.074,77
    // R$ / Alqueire (F10): R$ 307,48
    // R$ / Ponto (G10): R$ 614,95
    expect(result.details.custoTalhaoCalculated).toBeCloseTo(3074.77, 2);
    expect(result.totalValue).toBeCloseTo(3074.77, 2);
    expect(result.totalValuePerAlq).toBeCloseTo(307.48, 2);
    expect(result.totalValuePerPoint).toBeCloseTo(614.95, 2);

    // Verify detailed components
    expect(result.details.jurosFactor).toBeCloseTo(1.14248, 4);
    expect(result.details.numAnalises20_40cm).toBe(1);
    expect(result.details.numAnalisesBIOAS).toBe(1);
    expect(result.details.custoAnalisesBIOAS).toBeCloseTo(205.20, 2);
    expect(result.details.travelCost).toBeCloseTo(95.71, 2); // 4.785714 * 10 * 2

    // Verify invoice breakdown matching PEDIDO CONFERENCIA (rows 40-44)
    expect(result.details.breakdown.analiseMacroUnit).toBeCloseTo(124.70, 2); // 61.40 + 17.50 + 12.50 + 33.30
    expect(result.details.breakdown.analiseMacroTotal).toBeCloseTo(623.50, 2); // 5 * 124.70
    expect(result.details.breakdown.analise20_40Unit).toBeCloseTo(73.90, 2);
    expect(result.details.breakdown.analise20_40Total).toBeCloseTo(73.90, 2);
    expect(result.details.breakdown.analiseBIOASUnit).toBeCloseTo(205.20, 2);
    expect(result.details.breakdown.analiseBIOASTotal).toBeCloseTo(205.20, 2);
    expect(result.details.breakdown.coletaServicoTotal).toBeCloseTo(2172.17, 2);
    expect(result.details.breakdown.coletaServicoPerAlq).toBeCloseTo(217.22, 2);
  });

  it('should match user exact screenshot with 20 alq, 15 análises, 10km, 01/01/2027 (R$ 8.584,20)', () => {
    const service2026 = new ConferenciaService([
      { id: '1', code: 'VALOR_ALQ_CONFERENCIA', name: 'Valor Alqueire Conferencia', value: 71.666667, description: '' },
      { id: '2', code: 'VALOR_PONTO_CONFERE_COMPACTACAO', name: 'Valor Ponto Confere Compactacao', value: 361.111111, description: '' },
      { id: '3', code: 'JUROS_PAGAMENTO_PRAZO_PERCENTUAL', name: 'Juros Pagamento Prazo Percentual', value: 1.2, description: '' },
      { id: '4', code: 'ANALISE_20_40_CM_VALOR_ANALISE', name: 'Analise 20-40 CM Valor Analise', value: 73.90, description: '' },
      { id: '5', code: 'DATA_BASE_CALCULO_JURO', name: 'Data Base Calculo Juro', value: 20251231, description: '' },
      { id: '6', code: 'VALOR_ANALISE_NOVA_AREA', name: 'Valor Analise Nova Area', value: 61.40, description: '' },
      { id: '7', code: 'VALOR_ANALISE_ADUBO_BASE', name: 'Valor Analise Adubo Base', value: 17.50, description: '' },
      { id: '8', code: 'VALOR_ANALISE_ENXOFRE', name: 'Valor Analise Enxofre', value: 12.50, description: '' },
      { id: '9', code: 'VALOR_ANALISE_FISICA_UNITARIO', name: 'Valor Analise Fisica Unitario', value: 33.30, description: '' },
      { id: '10', code: 'VALOR_OLEO_DIESEL', name: 'Valor Oleo Diesel', value: 8.375, description: '' },
      { id: '11', code: 'VALOR_LAB_BIOAS', name: 'Valor Lab BIOAS', value: 205.20, description: '' },
    ]);

    const result = service2026.calculate({
      clienteDesejaNotaFiscal: 'N',
      distanciaFazendaKm: 10,
      vencimentoServico: '01/01/2027',
      desejaAnaliseFisica: 'N',
      percentualAnalises20_40cm: 20,
      percentualAnalisesBIOAS: 20,
      alqueires: 20.0,
      numAnalises: 15,
      totalAlqueires: 20.0,
    });

    expect(result.totalValue).toBeCloseTo(8584.20, 2);
    expect(result.totalValuePerAlq).toBeCloseTo(429.21, 2);
    expect(result.totalValuePerPoint).toBeCloseTo(572.28, 2);
    expect(result.valorTotalSugerido).toBeCloseTo(8584.20, 2);
    expect(result.sugeridoPerAlq).toBeCloseTo(429.21, 2);
    expect(result.sugeridoPerPoint).toBeCloseTo(572.28, 2);
    expect(result.details.breakdown.coletaServicoTotal).toBeCloseTo(6375.90, 2);
    expect(result.details.breakdown.analiseMacroTotal).toBeCloseTo(1371.00, 2);
    expect(result.details.breakdown.analise20_40Total).toBeCloseTo(221.70, 2);
    expect(result.details.breakdown.analiseBIOASTotal).toBeCloseTo(615.60, 2);

    // Test increasing 1 alqueire to 21 alq (matching spreadsheet cell F10: R$ 408,77/alq)
    const result21 = service2026.calculate({
      clienteDesejaNotaFiscal: 'N',
      distanciaFazendaKm: 10,
      vencimentoServico: '01/01/2027',
      desejaAnaliseFisica: 'N',
      percentualAnalises20_40cm: 20,
      percentualAnalisesBIOAS: 20,
      alqueires: 21.0,
      numAnalises: 15,
      totalAlqueires: 20.0,
    });

    expect(result21.totalValue).toBeCloseTo(8584.20, 2);
    expect(result21.totalValuePerAlq).toBeCloseTo(408.77, 2);
    expect(result21.totalValuePerPoint).toBeCloseTo(572.28, 2);
  });

  it('should support manual commercial discounts and fixed closed value', () => {
    const service2026 = new ConferenciaService([
      { id: '1', code: 'VALOR_ALQ_CONFERENCIA', name: 'Valor Alqueire Conferencia', value: 71.666667, description: '' },
      { id: '2', code: 'VALOR_PONTO_CONFERE_COMPACTACAO', name: 'Valor Ponto Confere Compactacao', value: 361.111111, description: '' },
      { id: '3', code: 'JUROS_PAGAMENTO_PRAZO_PERCENTUAL', name: 'Juros Pagamento Prazo Percentual', value: 1.2, description: '' },
      { id: '4', code: 'ANALISE_20_40_CM_VALOR_ANALISE', name: 'Analise 20-40 CM Valor Analise', value: 73.90, description: '' },
      { id: '5', code: 'DATA_BASE_CALCULO_JURO', name: 'Data Base Calculo Juro', value: 20251231, description: '' },
      { id: '6', code: 'VALOR_ANALISE_NOVA_AREA', name: 'Valor Analise Nova Area', value: 61.40, description: '' },
      { id: '7', code: 'VALOR_ANALISE_ADUBO_BASE', name: 'Valor Analise Adubo Base', value: 17.50, description: '' },
      { id: '8', code: 'VALOR_ANALISE_ENXOFRE', name: 'Valor Analise Enxofre', value: 12.50, description: '' },
      { id: '9', code: 'VALOR_ANALISE_FISICA_UNITARIO', name: 'Valor Analise Fisica Unitario', value: 33.30, description: '' },
      { id: '10', code: 'VALOR_OLEO_DIESEL', name: 'Valor Oleo Diesel', value: 8.375, description: '' },
      { id: '11', code: 'VALOR_LAB_BIOAS', name: 'Valor Lab BIOAS', value: 205.20, description: '' },
    ]);

    // 10% discount
    const withPctDiscount = service2026.calculate({
      clienteDesejaNotaFiscal: 'N',
      distanciaFazendaKm: 10,
      vencimentoServico: '01/01/2027',
      desejaAnaliseFisica: 'N',
      percentualAnalises20_40cm: 20,
      percentualAnalisesBIOAS: 20,
      alqueires: 20.0,
      numAnalises: 15,
      totalAlqueires: 20.0,
      descontoPercentualManual: 10,
    });

    expect(withPctDiscount.valorTotalSugerido).toBeCloseTo(8584.20, 2);
    expect(withPctDiscount.desconto).toBeCloseTo(858.42, 2);
    expect(withPctDiscount.totalValue).toBeCloseTo(7725.78, 2);

    // Fixed closed value
    const withClosedValue = service2026.calculate({
      clienteDesejaNotaFiscal: 'N',
      distanciaFazendaKm: 10,
      vencimentoServico: '01/01/2027',
      desejaAnaliseFisica: 'N',
      percentualAnalises20_40cm: 20,
      percentualAnalisesBIOAS: 20,
      alqueires: 20.0,
      numAnalises: 15,
      totalAlqueires: 20.0,
      valorFechadoManual: 8000,
    });

    expect(withClosedValue.totalValue).toBe(8000);
    expect(withClosedValue.desconto).toBeCloseTo(584.20, 2);
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

  it('should derive valorKm dynamically when VALOR_OLEO_DIESEL is provided and KM override is not set', () => {
    const varsWithoutKm = mockCostVariables.filter(
      (v) => v.code !== 'VALOR_KM_CONFERENCIA_FOLHA' && v.code !== 'VALOR_KM_CONFERENCIA_FOLHA_CALCULADO',
    );
    const variablesWithDiesel: CostVariable[] = [
      ...varsWithoutKm,
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

    // In LucasRafael.xlsm, BANCO DE DADOS!B12 is =(B25 / 7 * 4) = 3.966386...
    expect(result.details.valorKmCalculated).toBeCloseTo((6.9411764705882355 / 7) * 4, 4);
  });

  it('should recalculate when diesel price increases (without direct KM override) and respect direct KM edit', () => {
    const varsWithoutKm = mockCostVariables.filter(
      (v) => v.code !== 'VALOR_KM_CONFERENCIA_FOLHA' && v.code !== 'VALOR_KM_CONFERENCIA_FOLHA_CALCULADO',
    );
    const originalService = new ConferenciaService([
      ...varsWithoutKm,
      { id: '11', name: 'Valor Oleo Diesel', code: 'VALOR_OLEO_DIESEL', value: 6.94, description: '' },
    ]);

    const higherDieselService = new ConferenciaService([
      ...varsWithoutKm,
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

    // Direct KM override must be respected even when VALOR_OLEO_DIESEL is present
    const directKmService = new ConferenciaService([
      ...varsWithoutKm,
      { id: '11', name: 'Valor Oleo Diesel', code: 'VALOR_OLEO_DIESEL', value: 6.94, description: '' },
      { id: '12', name: 'Valor KM', code: 'VALOR_KM_CONFERENCIA_FOLHA', value: 6.50, description: '' },
    ]);
    const resDirectKm = directKmService.calculate({
      clienteDesejaNotaFiscal: 'S',
      distanciaFazendaKm: 50,
      vencimentoServico: '30/03/2026',
      desejaAnaliseFisica: 'N',
      percentualAnalises20_40cm: 10,
      alqueires: 10,
      numAnalises: 10,
      totalAlqueires: 10,
    });
    expect(resDirectKm.details.valorKmCalculated).toBe(6.50);
  });

  it('should use 2026 defaults when initialized without variables', () => {
    const service2026 = new ConferenciaService([]);
    const result = service2026.calculate({
      clienteDesejaNotaFiscal: 'S',
      distanciaFazendaKm: 10,
      vencimentoServico: '31/12/2025',
      desejaAnaliseFisica: 'N',
      percentualAnalises20_40cm: 10,
      alqueires: 10,
      numAnalises: 5,
      totalAlqueires: 10,
    });

    // 2026 default km cost = 4.785714
    expect(result.details.valorKmCalculated).toBeCloseTo(4.785714, 4);
    expect(result.details.jurosFactor).toBe(1.0); // Exactly on 20251231
    expect(result.details.custoAnalises20_40cm).toBeCloseTo(73.90 + 71.666667, 2);
  });

  it('should calculate BIOAS analyses according to percentage in LucasRafael.xlsm', () => {
    const service2026 = new ConferenciaService([
      { id: '1', name: 'Valor Laboratório BIOAS', code: 'VALOR_LAB_BIOAS', value: 205.20, description: '' }
    ]);

    const result = service2026.calculate({
      clienteDesejaNotaFiscal: 'S',
      distanciaFazendaKm: 10,
      vencimentoServico: '31/12/2025',
      desejaAnaliseFisica: 'N',
      percentualAnalises20_40cm: 0,
      percentualAnalisesBIOAS: 20, // 20%
      alqueires: 10,
      numAnalises: 10, // 20% of 10 = 2 BIOAS
      totalAlqueires: 10,
    });

    expect(result.details.numAnalisesBIOAS).toBe(2);
    expect(result.details.custoAnalisesBIOAS).toBeCloseTo(2 * 205.20, 2);
    expect(result.details.breakdown.analiseBIOASTotal).toBeCloseTo(410.40, 2);
    expect(result.details.breakdown.analiseBIOASUnit).toBeCloseTo(205.20, 2);
  });
});
