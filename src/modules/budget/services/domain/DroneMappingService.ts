import { differenceInDays } from 'date-fns';
import { CostVariable } from './ConferenciaService';

export interface DroneMappingParams {
  alqueires: number;
  distanciaKm: number;
  vencimentoServico: string; // DD/MM/YYYY
  servicoFungoNematoide?: boolean; // Ortomosaico/Mapeamento de Fungo e Nematóide (Row 27 in PEDIDO DRONE)
  servicoCurvasNivel?: boolean;    // Ortomosaico/Projeto de Curvas de Nível (Row 28 in PEDIDO DRONE)
  desconto?: number;
}

export interface DroneMappingCalculationResult {
  totalValue: number;
  totalValuePerAlq: number;
  details: {
    jurosFactor: number;
    servicoFungoNematoide: boolean;
    servicoCurvasNivel: boolean;
    nomeServico: string;
    precoBaseUnitario: number;
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
    const {
      alqueires,
      distanciaKm,
      vencimentoServico,
      servicoFungoNematoide = true,
      servicoCurvasNivel = false,
      desconto = 0,
    } = params;

    const VOO_DRONE_ALQ_ANO = this.getVariableValue('VOO_DRONE_ALQ_ANO') || 50;
    // In Excel sheet 'PEDIDO DRONE', cell M34 uses POWER(1.03, ...), i.e. 3.0% per month
    const JUROS_DRONE_PERCENTUAL =
      this.getVariableValue('JUROS_DRONE_PERCENTUAL') || 3.0;
    // In Excel sheet 'PEDIDO DRONE', cell M31 is 44956 = 30/01/2023
    const DATA_BASE_CALCULO_JURO_DRONE =
      this.getVariableValue('DATA_BASE_CALCULO_JURO_DRONE') || 20230130;

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

    const yearJuro = Math.floor(DATA_BASE_CALCULO_JURO_DRONE / 10000);
    const monthJuro = Math.floor((DATA_BASE_CALCULO_JURO_DRONE % 10000) / 100);
    const dayJuro = DATA_BASE_CALCULO_JURO_DRONE % 100;
    const dataBaseJuroDate = new Date(yearJuro, monthJuro - 1, dayJuro);

    const daysDifference = differenceInDays(vencimentoDate, dataBaseJuroDate);
    const jurosFactor =
      daysDifference > 0
        ? Math.pow(1 + JUROS_DRONE_PERCENTUAL / 100, daysDifference / 30)
        : 1;

    // Excel PEDIDO DRONE I40:
    // (IF(AND(C27="",C28=""),0,IF(AND(C27<>"",C28=""),'BANCO DE DADOS'!B26,IF(C28<>"",'BANCO DE DADOS'!B26*2,0))))*M34
    let precoBaseUnitario = 0;
    let nomeServico = 'Nenhum serviço selecionado';
    if (servicoCurvasNivel) {
      precoBaseUnitario = VOO_DRONE_ALQ_ANO * 2;
      nomeServico = servicoFungoNematoide
        ? 'Ortomosaico / Curvas de Nível + Fungo e Nematóide'
        : 'Ortomosaico / Projeto de Curvas de Nível';
    } else if (servicoFungoNematoide) {
      precoBaseUnitario = VOO_DRONE_ALQ_ANO;
      nomeServico = 'Ortomosaico / Mapeamento de Fungo e Nematóide';
    }

    const precoUnitarioAlq = precoBaseUnitario * jurosFactor;
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
        servicoFungoNematoide,
        servicoCurvasNivel,
        nomeServico,
        precoBaseUnitario,
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
