const fs = require('fs');
const path = require('path');

const frontendPath = path.resolve(__dirname, '../../farm-flow-frontend');

// 1. DroneMappingService.ts
const droneMappingServiceContent = `import { differenceInDays } from 'date-fns';
import { CostVariable } from './ConferenciaService';

export interface DroneMappingParams {
  alqueires: number;
  distanciaKm: number;
  vencimentoServico: string; // DD/MM/YYYY
  desconto?: number;
}

export interface DroneMappingCalculationResult {
  totalValue: number;
  totalValuePerAlq: number;
  details: {
    jurosFactor: number;
    precoUnitarioAlq: number;
    subtotalArea: number;
    precoUnitarioKm: number;
    subtotalDeslocamento: number;
    desconto: number;
    alqueires: number;
    distanciaKm: number;
  };
}

export class DroneMappingService {
  private costVariables: Map<string, number>;

  constructor(costVariables: CostVariable[]) {
    this.costVariables = new Map(
      costVariables.map((variable) => [variable.code, Number(variable.value) || 0])
    );
  }

  public getVariableValue(code: string): number {
    const value = this.costVariables.get(code);
    return value === undefined ? 0 : value;
  }

  public calculate(params: DroneMappingParams): DroneMappingCalculationResult {
    const { alqueires, distanciaKm, vencimentoServico, desconto = 0 } = params;

    const VOO_DRONE_ALQ_ANO = this.getVariableValue('VOO_DRONE_ALQ_ANO') || 50;
    // In Excel sheet 'PEDIDO DRONE', cell M34 uses POWER(1.03, ...), i.e. 3.0% per month
    const JUROS_DRONE_PERCENTUAL =
      this.getVariableValue('JUROS_DRONE_PERCENTUAL') || 3.0;
    const DATA_BASE_CALCULO_JURO = this.getVariableValue('DATA_BASE_CALCULO_JURO') || 20241231;

    // KM cost: dynamically computed from diesel if available
    const valorDiesel = this.getVariableValue('VALOR_OLEO_DIESEL');
    let valorKm = this.getVariableValue('VALOR_KM_CONFERENCIA_FOLHA_CALCULADO');
    if (valorDiesel > 0) {
      valorKm = (valorDiesel / 7) * 2 * 2.5;
    } else if (valorKm === 0) {
      valorKm = this.getVariableValue('VALOR_KM_CONFERENCIA_FOLHA') || 4.96;
    }

    // Parse dates
    const [day, month, year] = vencimentoServico.split('/').map(Number);
    const vencimentoDate = new Date(year, month - 1, day);

    const yearJuro = Math.floor(DATA_BASE_CALCULO_JURO / 10000);
    const monthJuro = Math.floor((DATA_BASE_CALCULO_JURO % 10000) / 100);
    const dayJuro = DATA_BASE_CALCULO_JURO % 100;
    const dataBaseJuroDate = new Date(yearJuro, monthJuro - 1, dayJuro);

    const daysDifference = differenceInDays(vencimentoDate, dataBaseJuroDate);
    const jurosFactor =
      daysDifference > 0
        ? Math.pow(1 + JUROS_DRONE_PERCENTUAL / 100, daysDifference / 30)
        : 1;

    const precoUnitarioAlq = VOO_DRONE_ALQ_ANO * jurosFactor;
    const subtotalArea = alqueires * precoUnitarioAlq;

    const precoUnitarioKm = valorKm * jurosFactor;
    const subtotalDeslocamento = distanciaKm * precoUnitarioKm;

    const totalValue = Math.max(0, subtotalArea + subtotalDeslocamento - desconto);
    const totalValuePerAlq = alqueires > 0 ? totalValue / alqueires : 0;

    return {
      totalValue,
      totalValuePerAlq,
      details: {
        jurosFactor,
        precoUnitarioAlq,
        subtotalArea,
        precoUnitarioKm,
        subtotalDeslocamento,
        desconto,
        alqueires,
        distanciaKm,
      },
    };
  }

  public formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }
}
`;

fs.writeFileSync(path.join(frontendPath, 'src/services/DroneMappingService.ts'), droneMappingServiceContent, 'utf-8');
console.log('Updated DroneMappingService.ts in frontend');

// 2. DroneMappingService.spec.ts
const droneMappingServiceSpecContent = `import { describe, it, expect } from 'vitest';
import { DroneMappingService } from './DroneMappingService';
import { CostVariable } from './ConferenciaService';

const mockCostVariables: CostVariable[] = [
  { id: '1', name: 'Voo Drone Alq Ano', code: 'VOO_DRONE_ALQ_ANO', value: 50, description: '' },
  { id: '2', name: 'Juros Pagamento Prazo Percentual', code: 'JUROS_PAGAMENTO_PRAZO_PERCENTUAL', value: 1.5, description: '' },
  { id: '3', name: 'Data Base Calculo Juro', code: 'DATA_BASE_CALCULO_JURO', value: 20241231, description: '' },
  { id: '4', name: 'Valor KM Conferencia Folha Calculado', code: 'VALOR_KM_CONFERENCIA_FOLHA_CALCULADO', value: 4.957983193277311, description: '' },
];

describe('DroneMappingService', () => {
  it('should calculate drone mapping area and travel matching PEDIDO DRONE in budget.xlsm', () => {
    const service = new DroneMappingService(mockCostVariables);

    const result = service.calculate({
      alqueires: 10,
      distanciaKm: 20,
      vencimentoServico: '31/12/2024',
    });

    // Juros: 1.0 (same date)
    // Area: 10 * 50 = 500
    // Travel: 20 * 4.95798 = 99.16
    // Total: 599.16
    expect(result.details.precoUnitarioAlq).toBe(50);
    expect(result.details.subtotalArea).toBe(500);
    expect(result.details.subtotalDeslocamento).toBeCloseTo(99.16, 2);
    expect(result.totalValue).toBeCloseTo(599.16, 2);
  });

  it('should calculate drone mapping with 3.0% monthly interest rate for future payment', () => {
    const service = new DroneMappingService(mockCostVariables);

    const result = service.calculate({
      alqueires: 10,
      distanciaKm: 20,
      vencimentoServico: '01/11/2026', // 670 days from 31/12/2024
    });

    // jurosFactor: POWER(1.03, 670/30) = 1.93507596...
    // Total base: 500 + 99.15966 = 599.15966
    // Total: 599.15966 * 1.93507596 = 1159.42
    expect(result.details.jurosFactor).toBeCloseTo(1.9351, 3);
    expect(result.totalValue).toBeCloseTo(1159.42, 2);
  });
});
`;

fs.writeFileSync(path.join(frontendPath, 'src/services/DroneMappingService.spec.ts'), droneMappingServiceSpecContent, 'utf-8');
console.log('Updated DroneMappingService.spec.ts in frontend');
