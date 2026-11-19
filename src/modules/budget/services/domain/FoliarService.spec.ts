import { describe, it, expect } from 'vitest';
import { FoliarService } from './FoliarService';
import { CostVariable } from './ConferenciaService';

const mockCostVariables2026: CostVariable[] = [
  { id: '1', name: 'Valor Alqueire Folha', code: 'VALOR_ALQ_FOLHA', value: 18, description: '' },
  { id: '2', name: 'Valor Analise Foliar', code: 'VALOR_ANALISE_FOLIAR', value: 90, description: '' },
  { id: '3', name: 'Juros Foliar Percentual', code: 'JUROS_FOLIAR_PERCENTUAL', value: 3.0, description: '' },
  { id: '4', name: 'Data Base Calculo Juro', code: 'DATA_BASE_CALCULO_JURO', value: 20251231, description: '' },
  { id: '5', name: 'Valor Oleo Diesel', code: 'VALOR_OLEO_DIESEL', value: 8.375, description: '' },
  { id: '6', name: 'Valor KM Conferencia Folha Calculado', code: 'VALOR_KM_CONFERENCIA_FOLHA_CALCULADO', value: 4.7857142857142856, description: '' },
];

describe('FoliarService (LucasRafael.xlsm 2026)', () => {
  it('should calculate unified foliar formula matching INPUT FOLHA!E6 with NF=S', () => {
    const service = new FoliarService(mockCostVariables2026);

    const result = service.calculate({
      clienteDesejaNotaFiscal: 'S',
      distanciaFazendaKm: 10,
      vencimentoServico: '01/12/2026',
      alqueires: 10,
      totalAlqueires: 10,
      numPontos: 5,
    });

    // Days from 31/12/2025 to 01/12/2026 = 335 days
    // F2 = POWER(1.03, 335/30) = 1.39116758...
    // base = 10 * 18 + 5 * 90 = 180 + 450 = 630
    // travel (round-trip) = 4.7857142857 * 10 * 2 = 95.7142857...
    // total = 630 * 1 * 1.39116758 + 95.7142857 = 876.43558 + 95.71429 = 972.15
    const expectedJuros = Math.pow(1.03, 335 / 30);
    const expectedTravel = (8.375 / 7) * 4 * 10 * 2;
    const expectedTotal = 630 * expectedJuros + expectedTravel;

    expect(result.details.jurosFactor).toBeCloseTo(expectedJuros, 6);
    expect(result.details.travelCost).toBeCloseTo(expectedTravel, 2);
    expect(result.totalValue).toBeCloseTo(expectedTotal, 2);
    expect(result.totalValuePerAlq).toBeCloseTo(expectedTotal / 10, 2);
    expect(result.totalValuePerPoint).toBeCloseTo(expectedTotal / 5, 2);
    expect(result.details.custoLaboratorial).toBe(450.00);
  });

  it('should apply 0.93 factor only to service+lab (not travel) when Nota Fiscal is N', () => {
    const service = new FoliarService(mockCostVariables2026);

    const result = service.calculate({
      clienteDesejaNotaFiscal: 'N',
      distanciaFazendaKm: 20,
      vencimentoServico: '31/12/2025',
      alqueires: 10,
      totalAlqueires: 10,
      numPontos: 5,
    });

    // jurosFactor = 1 (same date)
    // (10 * 18 + 5 * 90) * 0.93 * 1 + (4.7857142857 * 20 * 2)
    // = 630 * 0.93 + 191.42857 = 585.90 + 191.43 = 777.33
    expect(result.details.jurosFactor).toBe(1);
    expect(result.totalValue).toBeCloseTo(777.33, 2);
  });

  it('should return 0 when numPontos is 0', () => {
    const service = new FoliarService(mockCostVariables2026);

    const result = service.calculate({
      clienteDesejaNotaFiscal: 'S',
      distanciaFazendaKm: 10,
      vencimentoServico: '01/12/2026',
      alqueires: 10,
      totalAlqueires: 10,
      numPontos: 0,
    });

    expect(result.totalValue).toBe(0);
    expect(result.totalValuePerAlq).toBe(0);
    expect(result.totalValuePerPoint).toBe(0);
  });
});
