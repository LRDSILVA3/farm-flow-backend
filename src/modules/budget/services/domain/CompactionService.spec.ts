import { describe, it, expect } from 'vitest';
import { CompactionService } from './CompactionService';
import { CostVariable } from './ConferenciaService';

const mockCostVariables: CostVariable[] = [
  { id: '1', name: 'Valor Ponto Confere Compactacao', code: 'VALOR_PONTO_CONFERE_COMPACTACAO', value: 430, description: '' },
  { id: '2', name: 'Juros Pagamento Prazo Percentual', code: 'JUROS_PAGAMENTO_PRAZO_PERCENTUAL', value: 1.5, description: '' },
  { id: '3', name: 'Data Base Calculo Juro', code: 'DATA_BASE_CALCULO_JURO', value: 20241231, description: '' },
  { id: '4', name: 'Valor KM Conferencia Folha Calculado', code: 'VALOR_KM_CONFERENCIA_FOLHA_CALCULADO', value: 4.957983193277311, description: '' },
];

describe('CompactionService', () => {
  it('should calculate compaction points and travel matching PEDIDO COMPACTA in budget.xlsm', () => {
    const service = new CompactionService(mockCostVariables);

    // In PEDIDO COMPACTA:
    // D32 (vencimento): 30/05/2025 (serial 45807)
    // M40 (database): 31/12/2024 (serial 45657)
    // days difference = 150 days -> 150/30 = 5 months
    // jurosFactor = 1.015 ^ 5 = 1.0772840038843743
    // B40 (numPontos) = 4
    // I40 = 430 * 1.077284 = 463.2321
    // J40 = 4 * 463.2321 = 1852.928
    // B41 (distancia) = 50
    // I41 = 4.95798 * 1.077284 = 5.341156
    // J41 = 50 * 5.341156 = 267.0578
    // Subtotal = 1852.93 + 267.06 = 2119.99
    // Desconto = 620
    // Total = 1499.99 (R$ 1.500,00)
    const result = service.calculate({
      numPontos: 4,
      distanciaKm: 50,
      vencimentoServico: '30/05/2025',
      desconto: 620,
    });

    expect(result.details.jurosFactor).toBeCloseTo(1.077284, 5);
    expect(result.details.precoUnitarioPonto).toBeCloseTo(463.23, 2);
    expect(result.details.subtotalPontos).toBeCloseTo(1852.93, 2);
    expect(result.details.precoUnitarioKm).toBeCloseTo(5.34, 2);
    expect(result.details.subtotalDeslocamento).toBeCloseTo(267.06, 2);
    expect(result.totalValue).toBeCloseTo(1499.99, 2);
  });
});
