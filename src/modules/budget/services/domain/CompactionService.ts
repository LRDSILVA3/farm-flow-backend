import { differenceInDays } from 'date-fns';
import { CostVariable } from './ConferenciaService';

export interface CompactionParams {
  numPontos: number;
  distanciaKm: number;
  vencimentoServico: string; // DD/MM/YYYY
  desconto?: number;
}

export interface CompactionCalculationResult {
  totalValue: number;
  totalValuePerPoint: number;
  details: {
    jurosFactor: number;
    precoUnitarioPonto: number;
    subtotalPontos: number;
    precoUnitarioKm: number;
    subtotalDeslocamento: number;
    desconto: number;
    numPontos: number;
    distanciaKm: number;
  };
}

export class CompactionService {
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

  private getVar(code: string, fallback: number): number {
    return this.costVariables.has(code) ? this.costVariables.get(code)! : fallback;
  }

  public calculate(params: CompactionParams): CompactionCalculationResult {
    const { numPontos, distanciaKm, vencimentoServico, desconto = 0 } = params;

    const VALOR_PONTO_CONFERE_COMPACTACAO = this.getVar('VALOR_PONTO_CONFERE_COMPACTACAO', 361.111111);
    const JUROS_PAGAMENTO_PRAZO_PERCENTUAL = this.getVar('JUROS_PAGAMENTO_PRAZO_PERCENTUAL', 1.2);
    const DATA_BASE_CALCULO_JURO = this.getVar('DATA_BASE_CALCULO_JURO', 20251231);

    // KM cost: reads VALOR_KM_CONFERENCIA_FOLHA directly if configured; falls back to diesel formula only if missing
    let valorKm: number;
    if (this.costVariables.has('VALOR_KM_CONFERENCIA_FOLHA')) {
      valorKm = this.costVariables.get('VALOR_KM_CONFERENCIA_FOLHA')!;
    } else if (this.costVariables.has('VALOR_KM_CONFERENCIA_FOLHA_CALCULADO')) {
      valorKm = this.costVariables.get('VALOR_KM_CONFERENCIA_FOLHA_CALCULADO')!;
    } else if (this.getVariableValue('VALOR_OLEO_DIESEL') > 0) {
      valorKm = (this.getVariableValue('VALOR_OLEO_DIESEL') / 7) * 4;
    } else {
      valorKm = 4.785714;
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
        ? Math.pow(1 + JUROS_PAGAMENTO_PRAZO_PERCENTUAL / 100, daysDifference / 30)
        : 1;

    // Excel PEDIDO COMPACTA formulas:
    // I40: =('BANCO DE DADOS'!B8) * $L$42
    // J40: =I40 * B40
    // I41: =(IF(B41>0, 'BANCO DE DADOS'!B12, 0)) * $L$42
    // J41: =I41 * B41
    const precoUnitarioPonto = VALOR_PONTO_CONFERE_COMPACTACAO * jurosFactor;
    const subtotalPontos = numPontos * precoUnitarioPonto;

    const precoUnitarioKm = valorKm * jurosFactor;
    const subtotalDeslocamento = distanciaKm * precoUnitarioKm;

    const totalValue = Math.max(0, subtotalPontos + subtotalDeslocamento - desconto);
    const totalValuePerPoint = numPontos > 0 ? totalValue / numPontos : 0;

    return {
      totalValue,
      totalValuePerPoint,
      details: {
        jurosFactor,
        precoUnitarioPonto,
        subtotalPontos,
        precoUnitarioKm,
        subtotalDeslocamento,
        desconto,
        numPontos,
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
