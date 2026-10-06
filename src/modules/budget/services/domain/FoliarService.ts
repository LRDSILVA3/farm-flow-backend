import { differenceInDays } from 'date-fns';
import { CostVariable } from './ConferenciaService';

export interface FoliarParams {
  calculoPor: 'A' | 'P'; // 'A' = Alqueire, 'P' = Ponto
  clienteDesejaNotaFiscal: 'S' | 'N';
  distanciaFazendaKm: number;
  vencimentoServico: string; // DD/MM/YYYY
  alqueires: number;
  totalAlqueires: number;
  numPontos: number;
}

export interface FoliarCalculationResult {
  totalValue: number;
  totalValuePerAlq: number;
  totalValuePerPoint: number;
  details: {
    jurosFactor: number;
    travelCost: number;
    valorKmCalculated: number;
    custoCampoCalculado: number;
    custoLaboratorial: number;
    numPontos: number;
    alqueires: number;
  };
}

export class FoliarService {
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

  public calculate(params: FoliarParams): FoliarCalculationResult {
    let {
      calculoPor,
      clienteDesejaNotaFiscal,
      distanciaFazendaKm,
      vencimentoServico,
      alqueires,
      totalAlqueires,
      numPontos,
    } = params;

    if (!totalAlqueires || totalAlqueires === 0) {
      totalAlqueires = alqueires;
    }

    const VALOR_ALQ_FOLHA = this.getVariableValue('VALOR_ALQ_FOLHA') || 60;
    const VALOR_PONTO_CONFERE_COMPACTACAO = this.getVariableValue('VALOR_PONTO_CONFERE_COMPACTACAO') || 430;
    const VALOR_ANALISE_FOLIAR = this.getVariableValue('VALOR_ANALISE_FOLIAR') || 70;
    const VALOR_VIAGEM_CONFERENCIA_FOLHA = this.getVariableValue('VALOR_VIAGEM_CONFERENCIA_FOLHA') || 330;
    // In Excel sheet 'INPUT FOLHA ', cell F2 uses POWER(1.03, DAYS(E2,H2)/30), i.e. 3.0% per month
    const JUROS_FOLIAR_PERCENTUAL =
      this.getVariableValue('JUROS_FOLIAR_PERCENTUAL') || 3.0;
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
        ? Math.pow(1 + JUROS_FOLIAR_PERCENTUAL / 100, daysDifference / 30)
        : 1;

    // Travel cost
    const travelCostPerAlq = totalAlqueires > 0 ? (valorKm * distanciaFazendaKm) / totalAlqueires : 0;
    const travelCost = travelCostPerAlq * alqueires;

    let custoBase = 0;
    if (numPontos > 0 && alqueires > 0) {
      if (calculoPor === 'A') {
        // Alqueire calculation
        const baseCost = alqueires * VALOR_ALQ_FOLHA + travelCost;
        if (clienteDesejaNotaFiscal === 'S') {
          custoBase = baseCost < VALOR_PONTO_CONFERE_COMPACTACAO ? VALOR_PONTO_CONFERE_COMPACTACAO : baseCost;
        } else {
          // If no NF, 0.93 discount factor in Excel
          const minNoNf = VALOR_PONTO_CONFERE_COMPACTACAO * 0.93;
          custoBase = baseCost < minNoNf ? minNoNf : baseCost * 0.93;
        }
      } else {
        // Point calculation
        const viagemCost = totalAlqueires > 0 ? (VALOR_VIAGEM_CONFERENCIA_FOLHA / totalAlqueires) * alqueires : 0;
        const baseCost = numPontos * VALOR_PONTO_CONFERE_COMPACTACAO + travelCost + alqueires + viagemCost;
        if (clienteDesejaNotaFiscal === 'S') {
          custoBase = baseCost / 0.85;
        } else {
          custoBase = baseCost;
        }
      }
    }

    // In Excel, total for the job is custoBase * jurosFactor.
    // Laboratory analysis is already included in the point price (R$ 0,00 in PEDIDO FOLHA CLIENTE).
    // In PEDIDO FOLHA EMPRESA, laboratory cost (numPontos * 70) is separated from field cost.
    const totalValue = custoBase * jurosFactor;
    const custoLaboratorial = numPontos * VALOR_ANALISE_FOLIAR;
    const custoCampoCalculado = Math.max(0, totalValue - custoLaboratorial);

    return {
      totalValue,
      totalValuePerAlq: alqueires > 0 ? totalValue / alqueires : 0,
      totalValuePerPoint: numPontos > 0 ? totalValue / numPontos : 0,
      details: {
        jurosFactor,
        travelCost,
        valorKmCalculated: valorKm,
        custoCampoCalculado,
        custoLaboratorial,
        numPontos,
        alqueires,
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
