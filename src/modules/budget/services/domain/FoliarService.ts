import { differenceInDays } from 'date-fns';
import { CostVariable } from './ConferenciaService';

export interface FoliarParams {
  calculoPor?: 'A' | 'P'; // Deprecated in LucasRafael.xlsm (2026): unified formula
  clienteDesejaNotaFiscal: 'S' | 'N';
  distanciaFazendaKm: number;
  vencimentoServico: string; // DD/MM/YYYY
  alqueires: number;
  totalAlqueires?: number;
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

    const VALOR_ALQ_FOLHA = this.getVariableValue('VALOR_ALQ_FOLHA') || 18;
    const VALOR_PONTO_CONFERE_COMPACTACAO = this.getVariableValue('VALOR_PONTO_CONFERE_COMPACTACAO') || 361.111111;
    const VALOR_ANALISE_FOLIAR = this.getVariableValue('VALOR_ANALISE_FOLIAR') || 90;
    const VALOR_VIAGEM_CONFERENCIA_FOLHA = this.getVariableValue('VALOR_VIAGEM_CONFERENCIA_FOLHA') || 366.666667;
    // In Excel sheet 'INPUT FOLHA ', cell F2 uses POWER(1.03, DAYS(E2,H2)/30), i.e. 3.0% per month
    const JUROS_FOLIAR_PERCENTUAL =
      this.getVariableValue('JUROS_FOLIAR_PERCENTUAL') || 3.0;
    const DATA_BASE_CALCULO_JURO = this.getVariableValue('DATA_BASE_CALCULO_JURO') || 20251231;

    // KM cost: dynamically computed from diesel if available
    const valorDiesel = this.getVariableValue('VALOR_OLEO_DIESEL');
    let valorKm = this.getVariableValue('VALOR_KM_CONFERENCIA_FOLHA_CALCULADO');
    if (valorDiesel > 0) {
      valorKm = (valorDiesel / 7) * 4;
    } else if (valorKm === 0) {
      valorKm = this.getVariableValue('VALOR_KM_CONFERENCIA_FOLHA') || 4.785714;
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

    // Travel cost (round-trip: * 2 in LucasRafael.xlsm 'INPUT FOLHA '!E6)
    const travelCostPerAlq = totalAlqueires > 0 ? (valorKm * distanciaFazendaKm * 2) / totalAlqueires : 0;
    const travelCost = travelCostPerAlq * alqueires;

    // LucasRafael.xlsm 'INPUT FOLHA '!E6 unified formula (replaces old A/P split):
    // =IF(C6=0, 0, (B6*'BANCO DE DADOS'!$B$9 + C6*'BANCO DE DADOS'!$B$11) * IF($E$3="S", 1, 0.93) * $F$2 + ('BANCO DE DADOS'!$B$12 * $E$4 * 2 / $B$26 * B6))
    const nfFactor = clienteDesejaNotaFiscal === 'S' ? 1 : 0.93;
    const totalValue =
      numPontos > 0
        ? (alqueires * VALOR_ALQ_FOLHA + numPontos * VALOR_ANALISE_FOLIAR) * nfFactor * jurosFactor + travelCost
        : 0;
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
