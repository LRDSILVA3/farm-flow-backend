import { describe, it, expect } from 'vitest';
import { DroneMappingService } from './DroneMappingService';
import { CostVariable } from './ConferenciaService';

const mockCostVariables2026: CostVariable[] = [
  { id: '1', name: 'Voo Drone Alq Ano', code: 'VOO_DRONE_ALQ_ANO', value: 50, description: '' },
  { id: '2', name: 'Juros Pagamento Prazo Percentual', code: 'JUROS_PAGAMENTO_PRAZO_PERCENTUAL', value: 1.2, description: '' },
  { id: '3', name: 'Data Base Calculo Juro', code: 'DATA_BASE_CALCULO_JURO', value: 20251231, description: '' },
  { id: '4', name: 'Valor Oleo Diesel', code: 'VALOR_OLEO_DIESEL', value: 8.375, description: '' },
];

describe('DroneMappingService (LucasRafael.xlsm 2026)', () => {
  it('should calculate drone mapping using 1.2% monthly interest from BANCO DE DADOS!B40', () => {
    const service = new DroneMappingService(mockCostVariables2026);

    const result = service.calculate({
      alqueires: 10,
      distanciaKm: 10,
      vencimentoServico: '01/11/2026',
      servicoFungoNematoide: true,
      servicoCurvasNivel: false,
    });

    // In LucasRafael.xlsm PEDIDO DRONE:
    // M31 = BANCO DE DADOS!B27 (31/12/2025), Days to 01/11/2026 = 305 days
    // M34 = POWER((100 + 1.2) / 100, 305/30) = 1.128945...
    const expectedJuros = Math.pow(1.012, 305 / 30);
    const expectedKm = (8.375 / 7) * 4;
    const expectedArea = 10 * 50 * expectedJuros;
    const expectedTravel = 10 * expectedKm * expectedJuros;
    const expectedTotal = expectedArea + expectedTravel;

    expect(result.details.jurosFactor).toBeCloseTo(expectedJuros, 6);
    expect(result.details.precoUnitarioAlq).toBeCloseTo(50 * expectedJuros, 2);
    expect(result.details.subtotalArea).toBeCloseTo(expectedArea, 2);
    expect(result.details.precoUnitarioKm).toBeCloseTo(expectedKm * expectedJuros, 2);
    expect(result.details.subtotalDeslocamento).toBeCloseTo(expectedTravel, 2);
    expect(result.totalValue).toBeCloseTo(expectedTotal, 2);
    expect(result.totalValuePerAlq).toBeCloseTo(expectedTotal / 10, 2);
  });

  it('should double unit price when Ortomosaico/Projeto de Curvas de Nível is selected', () => {
    const service = new DroneMappingService(mockCostVariables2026);

    const result = service.calculate({
      alqueires: 10,
      distanciaKm: 10,
      vencimentoServico: '01/11/2026',
      servicoFungoNematoide: false,
      servicoCurvasNivel: true, // 2x base price = 100/alq
    });

    const expectedJuros = Math.pow(1.012, 305 / 30);
    const expectedKm = (8.375 / 7) * 4;
    const expectedArea = 10 * 100 * expectedJuros;
    const expectedTravel = 10 * expectedKm * expectedJuros;

    expect(result.details.precoUnitarioAlq).toBeCloseTo(100 * expectedJuros, 2);
    expect(result.details.subtotalArea).toBeCloseTo(expectedArea, 2);
    expect(result.totalValue).toBeCloseTo(expectedArea + expectedTravel, 2);
  });

  it('should return 0 for area when no service is selected', () => {
    const service = new DroneMappingService(mockCostVariables2026);

    const result = service.calculate({
      alqueires: 10,
      distanciaKm: 10,
      vencimentoServico: '01/11/2026',
      servicoFungoNematoide: false,
      servicoCurvasNivel: false,
    });

    const expectedJuros = Math.pow(1.012, 305 / 30);
    const expectedKm = (8.375 / 7) * 4;

    expect(result.details.subtotalArea).toBe(0);
    expect(result.totalValue).toBeCloseTo(10 * expectedKm * expectedJuros, 2);
  });
});
