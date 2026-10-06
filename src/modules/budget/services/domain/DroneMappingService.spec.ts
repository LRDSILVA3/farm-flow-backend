import { describe, it, expect } from 'vitest';
import { DroneMappingService } from './DroneMappingService';
import { CostVariable } from './ConferenciaService';

const mockCostVariables: CostVariable[] = [
  { id: '1', name: 'Voo Drone Alq Ano', code: 'VOO_DRONE_ALQ_ANO', value: 50, description: '' },
  { id: '2', name: 'Juros Pagamento Prazo Percentual', code: 'JUROS_PAGAMENTO_PRAZO_PERCENTUAL', value: 1.5, description: '' },
  { id: '3', name: 'Data Base Calculo Juro', code: 'DATA_BASE_CALCULO_JURO', value: 20241231, description: '' },
  { id: '4', name: 'Valor KM Conferencia Folha Calculado', code: 'VALOR_KM_CONFERENCIA_FOLHA_CALCULADO', value: 4.957983193277311, description: '' },
];

describe('DroneMappingService', () => {
  it('should calculate drone mapping matching user Excel screenshot (R$ 2.121,74)', () => {
    const service = new DroneMappingService(mockCostVariables);

    const result = service.calculate({
      alqueires: 10,
      distanciaKm: 10,
      vencimentoServico: '01/11/2026',
      servicoFungoNematoide: true,
      servicoCurvasNivel: false,
    });

    // In Excel PEDIDO DRONE:
    // Base M31 = 44956 (30/01/2023)
    // Days to 01/11/2026 = 1371 days
    // jurosFactor = POWER(1.03, 1371/30) = 3.86065656...
    // Ortomosaico: 50 * 3.86065656 = 193.03 / alq -> 1930.33
    // Deslocamento: 4.957983 * 3.86065656 = 19.14 / km -> 191.41
    // Total = 1930.33 + 191.41 = 2121.74
    // R$/Alq = 212.17
    expect(result.details.jurosFactor).toBeCloseTo(3.8607, 4);
    expect(result.details.precoUnitarioAlq).toBeCloseTo(193.03, 2);
    expect(result.details.subtotalArea).toBeCloseTo(1930.33, 2);
    expect(result.details.precoUnitarioKm).toBeCloseTo(19.14, 2);
    expect(result.details.subtotalDeslocamento).toBeCloseTo(191.41, 2);
    expect(result.totalValue).toBeCloseTo(2121.74, 2);
    expect(result.totalValuePerAlq).toBeCloseTo(212.17, 2);
  });

  it('should double unit price when Ortomosaico/Projeto de Curvas de Nível is selected', () => {
    const service = new DroneMappingService(mockCostVariables);

    const result = service.calculate({
      alqueires: 10,
      distanciaKm: 10,
      vencimentoServico: '01/11/2026',
      servicoFungoNematoide: false,
      servicoCurvasNivel: true, // 2x base price = 100/alq
    });

    // 100 * 3.86065656 = 386.07 / alq -> 3860.66
    // Deslocamento: 191.41
    // Total = 3860.66 + 191.41 = 4052.07
    expect(result.details.precoUnitarioAlq).toBeCloseTo(386.07, 2);
    expect(result.details.subtotalArea).toBeCloseTo(3860.66, 2);
    expect(result.totalValue).toBeCloseTo(4052.07, 2);
  });

  it('should return 0 for area when no service is selected', () => {
    const service = new DroneMappingService(mockCostVariables);

    const result = service.calculate({
      alqueires: 10,
      distanciaKm: 10,
      vencimentoServico: '01/11/2026',
      servicoFungoNematoide: false,
      servicoCurvasNivel: false,
    });

    expect(result.details.subtotalArea).toBe(0);
    expect(result.totalValue).toBeCloseTo(191.41, 2); // only travel
  });
});
