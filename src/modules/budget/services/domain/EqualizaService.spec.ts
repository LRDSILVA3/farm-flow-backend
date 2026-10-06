import { describe, it, expect } from 'vitest';
import { EqualizaService } from './EqualizaService';

describe('EqualizaService', () => {
  const mockVariables = [
    { code: 'TIER_1_AP_PRICE', value: '295' },
    { code: 'VALOR_ALQ_CONFERENCIA', value: '65' },
    { code: 'VALOR_ALQ_FOLHA', value: '60' },
    { code: 'VALOR_PONTO_CONFERE_COMPACTACAO', value: '430' },
  ];

  it('should correctly calculate annual contract and total period values', () => {
    const service = new EqualizaService(mockVariables as any);

    const result = service.calculate({
      totalAlqueires: 120,
      percentualAnualAP: 0.33,
      descontoManual: 98,
    });

    expect(result.anosContrato).toBe(3);
    expect(result.details.temDescontoAreaMaior100).toBe(true);
    expect(result.totalAnualContrato).toBeGreaterThan(0);
    expect(result.totalPeriodoContrato).toBe(result.totalAnualContrato * 3);
    expect(result.parcelaAgosto + result.parcelaMarco).toBe(result.totalAnualContrato);
    expect(result.parcelaMensal).toBeCloseTo(result.totalAnualContrato / 12, 2);
  });
});
