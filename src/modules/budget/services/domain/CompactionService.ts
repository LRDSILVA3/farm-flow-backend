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

  public calculate(params: CompactionParams): CompactionCalculationResult {
    const { numPontos, distanciaKm, vencimentoServico, desconto = 0 } = params;

    const VALOR_PONTO_CONFERE_COMPACTACAO = this.getVariableValue('VALOR_PONTO_CONFERE_COMPACTACAO') || 430;
    const JUROS_PAGAMENTO_PRAZO_PERCENTUAL = this.getVariableValue('JUROS_PAGAMENTO_PRAZO_PERCENTUAL') || 1.5;
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
