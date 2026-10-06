import { describe, it, expect } from 'vitest';
import { DroneSprayingService } from './DroneSprayingService';
import { CostVariable } from './ConferenciaService';

const mockCostVariables: CostVariable[] = [
  { id: '1', name: 'Drone Pulverizacao Base Alq', code: 'DRONE_PULVE_BASE_ALQ', value: 240, description: '' },
  { id: '2', name: 'Drone Pulverizacao Preco Minimo Alq', code: 'DRONE_PULVE_PRECO_MINIMO_ALQ', value: 270, description: '' },
  { id: '3', name: 'Drone Pulverizacao Preco Programada', code: 'DRONE_PULVE_PRECO_PROGRAMADA', value: 240, description: '' },
  { id: '4', name: 'Drone Valor Obstaculo', code: 'DRONE_VALOR_OBSTACULO', value: 100, description: '' },
  { id: '5', name: 'Drone Valor Beira Mato', code: 'DRONE_VALOR_BEIRA_MATO', value: 0.50, description: '' },
  { id: '6', name: 'Drone Valor Fio Luz', code: 'DRONE_VALOR_FIO_LUZ', value: 1.00, description: '' },
  { id: '7', name: 'Drone Valor Ponto RTK', code: 'DRONE_VALOR_PONTO_RTK', value: 500, description: '' },
  { id: '8', name: 'Valor KM Conferencia Folha Calculado', code: 'VALOR_KM_CONFERENCIA_FOLHA_CALCULADO', value: 4.957983193277311, description: '' },
  { id: '9', name: 'Juros Pagamento Prazo Percentual', code: 'JUROS_PAGAMENTO_PRAZO_PERCENTUAL', value: 1.5, description: '' },
];

describe('DroneSprayingService', () => {
  it('should calculate drone spraying price with programmed area discount and no obstacles', () => {
    const service = new DroneSprayingService(mockCostVariables);

    const result = service.calculate({
      areaHa: 24.2, // 10 alqueires
      distanciaKm: 10,
      isProgramada: true,
      isJaMapeada: true,
      tipoSolidoOuLiquido: 'L',
      comNotaFiscal: true,
      vencimentoServico: '01/01/2025',
    });

    // 10 alqueires
    // Programada: 240 + (10 * 4.95798 / 10) = 240 + 4.96 = 244.96
    // Liquid, NF true, Juros: 1.0
    // Total per alq = 244.96
    // Total value = 244.96 * 10 = 2449.58
    expect(result.areaAlqueires).toBeCloseTo(10, 1);
    expect(result.precoPorAlqueire).toBeCloseTo(244.96, 2);
    expect(result.totalValue).toBeCloseTo(2449.58, 1);
  });
});
