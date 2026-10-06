import { describe, it, expect } from 'vitest';
import { FoliarService } from './FoliarService';
import { CostVariable } from './ConferenciaService';

const mockCostVariables: CostVariable[] = [
  { id: '1', name: 'Valor Alqueire Folha', code: 'VALOR_ALQ_FOLHA', value: 60, description: '' },
  { id: '2', name: 'Valor Ponto Confere Compactacao', code: 'VALOR_PONTO_CONFERE_COMPACTACAO', value: 430, description: '' },
  { id: '3', name: 'Valor Analise Foliar', code: 'VALOR_ANALISE_FOLIAR', value: 70, description: '' },
  { id: '4', name: 'Valor Viagem Conferencia Folha', code: 'VALOR_VIAGEM_CONFERENCIA_FOLHA', value: 330, description: '' },
  { id: '5', name: 'Juros Pagamento Prazo Percentual', code: 'JUROS_PAGAMENTO_PRAZO_PERCENTUAL', value: 1.5, description: '' },
  { id: '6', name: 'Data Base Calculo Juro', code: 'DATA_BASE_CALCULO_JURO', value: 20241231, description: '' },
  { id: '7', name: 'Valor KM Conferencia Folha Calculado', code: 'VALOR_KM_CONFERENCIA_FOLHA_CALCULADO', value: 4.957983193277311, description: '' },
];

describe('FoliarService', () => {
  it('should calculate foliar service matching budget.xlsm for user scenario (Por Ponto, Sem NF)', () => {
    const service = new FoliarService(mockCostVariables);

    const result = service.calculate({
      calculoPor: 'P',
      clienteDesejaNotaFiscal: 'N',
      distanciaFazendaKm: 10,
      vencimentoServico: '01/11/2026',
      alqueires: 10,
      totalAlqueires: 10,
      numPontos: 10,
    });

    // Excel formula: base = 10 * 430 + 4.957983 * 10 + 10 + 330 = 4689.58
    // F2 (juros 3.0% ao mes): POWER(1.03, 670/30) = 1.93507596...
    // Total = 4689.58 * 1.93507596 = 9074.69
    expect(result.totalValue).toBeCloseTo(9074.69, 2);
    expect(result.totalValuePerAlq).toBeCloseTo(907.47, 2);
    expect(result.totalValuePerPoint).toBeCloseTo(907.47, 2);
    expect(result.details.custoLaboratorial).toBe(700.00);
    expect(result.details.custoCampoCalculado).toBeCloseTo(8374.69, 2);
  });

  it('should calculate foliar service by area (Alqueire) with minimum threshold', () => {
    const service = new FoliarService(mockCostVariables);

    const result = service.calculate({
      calculoPor: 'A',
      clienteDesejaNotaFiscal: 'S',
      distanciaFazendaKm: 20,
      vencimentoServico: '31/12/2024',
      alqueires: 5,
      totalAlqueires: 5,
      numPontos: 5,
    });

    // Base cost: 5 * 60 + (4.95798 * 20) = 300 + 99.16 = 399.16
    // Since 399.16 < VALOR_PONTO_CONFERE_COMPACTACAO (430), min threshold is 430
    // Juros factor: 1 (same date)
    // Total: 430.00 (laboratory included). Laboratório separated: 5 * 70 = 350. Campo: 80.
    expect(result.totalValue).toBeCloseTo(430.00, 2);
    expect(result.details.custoLaboratorial).toBe(350.00);
    expect(result.details.custoCampoCalculado).toBeCloseTo(80.00, 2);
  });

  it('should calculate foliar service by area above minimum', () => {
    const service = new FoliarService(mockCostVariables);

    const result = service.calculate({
      calculoPor: 'A',
      clienteDesejaNotaFiscal: 'S',
      distanciaFazendaKm: 20,
      vencimentoServico: '31/12/2024',
      alqueires: 10,
      totalAlqueires: 10,
      numPontos: 5,
    });

    // Base: 10 * 60 + 99.16 = 699.16 > 430
    // Total: 699.16
    expect(result.totalValue).toBeCloseTo(699.16, 2);
  });

  it('should apply 0.93 discount when Nota Fiscal is N for Alqueire calculation', () => {
    const service = new FoliarService(mockCostVariables);

    const withNF = service.calculate({
      calculoPor: 'A',
      clienteDesejaNotaFiscal: 'S',
      distanciaFazendaKm: 20,
      vencimentoServico: '31/12/2024',
      alqueires: 10,
      totalAlqueires: 10,
      numPontos: 5,
    });

    const withoutNF = service.calculate({
      calculoPor: 'A',
      clienteDesejaNotaFiscal: 'N',
      distanciaFazendaKm: 20,
      vencimentoServico: '31/12/2024',
      alqueires: 10,
      totalAlqueires: 10,
      numPontos: 5,
    });

    expect(withoutNF.totalValue).toBeCloseTo(withNF.totalValue * 0.93, 2);
  });
});
