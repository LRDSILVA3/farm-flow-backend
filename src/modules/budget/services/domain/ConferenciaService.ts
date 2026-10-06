import { differenceInDays } from 'date-fns';

export interface ConferenciaParams {
  clienteDesejaNotaFiscal: 'S' | 'N';
  distanciaFazendaKm: number;
  vencimentoServico: string; // Expects DD/MM/YYYY format
  desejaAnaliseFisica: 'S' | 'N';
  percentualAnalises20_40cm: number;
  alqueires: number;
  numAnalises: number;
  totalAlqueires: number;
}

export interface CostVariable {
  id: string;
  name: string;
  code: string;
  value: number;
  description: string;
}

export interface ConferenciaDetails {
  jurosFactor: number;
  custoAnaliseFisica: number;
  costMethod1: number;
  costMethod2: number;
  selectedCostMethod: number;
  custoTalhaoCalculated: number;
  numAnalises20_40cm: number;
  custoAnalises20_40cm: number;
  travelCost: number;
  valorKmCalculated: number;
  breakdown: {
    coletaServicoTotal: number;
    coletaServicoPerAlq: number;
    analiseMacroTotal: number;
    analiseMacroUnit: number;
    analise20_40Total: number;
    analise20_40Unit: number;
  };
}

export interface ConferenciaCalculationResult {
  totalValue: number;
  totalValuePerAlq: number;
  totalValuePerPoint: number;
  details: ConferenciaDetails;
}

export class ConferenciaService {
  private costVariables: Map<string, number>;

  constructor(costVariables: CostVariable[]) {
    this.costVariables = new Map(
      costVariables.map((variable) => [variable.code, Number(variable.value) || 0])
    );
  }

  public getVariableValue(code: string): number {
    const value = this.costVariables.get(code);
    if (value === undefined) {
      return 0;
    }
    return value;
  }

  public calculate(params: ConferenciaParams): ConferenciaCalculationResult {
    let {
      distanciaFazendaKm,
      vencimentoServico,
      desejaAnaliseFisica,
      percentualAnalises20_40cm,
      alqueires,
      numAnalises,
      totalAlqueires,
    } = params;

    // Defensive programming: If totalAlqueires is 0, use plot alqueires
    if (!totalAlqueires || totalAlqueires === 0) {
      totalAlqueires = alqueires;
    }

    // Convert whole percentage (e.g. 10 for 10%) to decimal (0.1)
    let percDecimal = percentualAnalises20_40cm;
    if (percDecimal > 1 && percDecimal <= 100) {
      percDecimal = percDecimal / 100;
    }

    const VALOR_ALQ_CONFERENCIA = this.getVariableValue('VALOR_ALQ_CONFERENCIA');
    const VALOR_PONTO_CONFERE_COMPACTACAO = this.getVariableValue('VALOR_PONTO_CONFERE_COMPACTACAO');
    const JUROS_PAGAMENTO_PRAZO_PERCENTUAL = this.getVariableValue('JUROS_PAGAMENTO_PRAZO_PERCENTUAL');
    const ANALISE_20_40_CM_VALOR_ANALISE = this.getVariableValue('ANALISE_20_40_CM_VALOR_ANALISE');
    const DATA_BASE_CALCULO_JURO = this.getVariableValue('DATA_BASE_CALCULO_JURO');
    const VALOR_ANALISE_NOVA_AREA = this.getVariableValue('VALOR_ANALISE_NOVA_AREA');
    const VALOR_ANALISE_ADUBO_BASE = this.getVariableValue('VALOR_ANALISE_ADUBO_BASE');
    const VALOR_ANALISE_ENXOFRE = this.getVariableValue('VALOR_ANALISE_ENXOFRE');
    const VALOR_ANALISE_FISICA_UNITARIO = this.getVariableValue('VALOR_ANALISE_FISICA_UNITARIO');

    // KM cost: If VALOR_OLEO_DIESEL is configured, compute dynamically: (DIESEL / 7 * 2 * 2.5)
    // Excel formula: BANCO DE DADOS!B12 = (B25 / 7 * 2 * 2.5)
    const valorDiesel = this.getVariableValue('VALOR_OLEO_DIESEL');
    let valorKm = this.getVariableValue('VALOR_KM_CONFERENCIA_FOLHA_CALCULADO');
    if (valorDiesel > 0) {
      valorKm = (valorDiesel / 7) * 2 * 2.5;
    } else if (valorKm === 0) {
      valorKm = this.getVariableValue('VALOR_KM_CONFERENCIA_FOLHA');
    }

    // Parse service expiration date
    const [day, month, year] = vencimentoServico.split('/').map(Number);
    const vencimentoServicoDate = new Date(year, month - 1, day);

    // Parse DATA_BASE_CALCULO_JURO (format YYYYMMDD, default 20241231)
    const dataBaseVal = DATA_BASE_CALCULO_JURO || 20241231;
    const yearJuro = Math.floor(dataBaseVal / 10000);
    const monthJuro = Math.floor((dataBaseVal % 10000) / 100);
    const dayJuro = dataBaseVal % 100;
    const dataBaseJuroDate = new Date(yearJuro, monthJuro - 1, dayJuro);

    // Excel: F5 = IF(DAYS(E5,G4)>0, POWER((B40+100)/100, DAYS(E5,G4)/30), 1)
    const daysDifference = differenceInDays(vencimentoServicoDate, dataBaseJuroDate);
    const jurosFactor =
      daysDifference > 0
        ? Math.pow(1 + JUROS_PAGAMENTO_PRAZO_PERCENTUAL / 100, daysDifference / 30)
        : 1;

    // Travel cost calculation proportional to plot area:
    // Excel: (B12 * E4 / B29) * B9
    let travelCost = 0;
    let costMethod1 = 0;
    let costMethod2 = 0;
    let selectedCostMethod = 0;

    if (alqueires > 0 && totalAlqueires > 0) {
      const travelCostPerAlqueire = (valorKm * distanciaFazendaKm) / totalAlqueires;
      travelCost = travelCostPerAlqueire * alqueires;

      costMethod1 = alqueires * VALOR_ALQ_CONFERENCIA + travelCost;
      costMethod2 = numAnalises * VALOR_PONTO_CONFERE_COMPACTACAO + travelCost;
      selectedCostMethod = Math.max(costMethod1, costMethod2);
    }

    const custoTalhaoCalculated = selectedCostMethod * jurosFactor;

    // Excel F30: IF(E7>0, IF(C29*E7<=1, 1, ROUND(E7*C29, 0)), 0) * ('INPUT DADOS'!C23 + 'BANCO DE DADOS'!B10)
    // where C23 = ANALISE_20_40_CM_VALOR_ANALISE (70.00) and B10 = VALOR_ALQ_CONFERENCIA (65.00)
    let numAnalises20_40cm = 0;
    if (percDecimal > 0 && numAnalises > 0) {
      numAnalises20_40cm = numAnalises * percDecimal <= 1 ? 1 : Math.round(percDecimal * numAnalises);
    }

    const custoAnalises20_40cm =
      numAnalises20_40cm * (ANALISE_20_40_CM_VALOR_ANALISE + VALOR_ALQ_CONFERENCIA);

    // Total work value: Excel E30 = SUM(E9:E28) + F30
    // Note: In Excel, "Nota Fiscal" does not add a tax percentage to Conferencia total.
    const totalValue = custoTalhaoCalculated + custoAnalises20_40cm;
    const totalValuePerAlq = alqueires > 0 ? totalValue / alqueires : 0;
    const totalValuePerPoint = numAnalises > 0 ? totalValue / numAnalises : 0;

    // Breakdown matching PEDIDO CONFERENCIA items:
    const sumMacro = VALOR_ANALISE_NOVA_AREA + VALOR_ANALISE_ADUBO_BASE + VALOR_ANALISE_ENXOFRE;
    const custoAnaliseFisica = sumMacro + (desejaAnaliseFisica === 'S' ? VALOR_ANALISE_FISICA_UNITARIO : 0);
    const analiseMacroTotal = numAnalises * custoAnaliseFisica;
    const analise20_40Total = numAnalises20_40cm * ANALISE_20_40_CM_VALOR_ANALISE;
    const coletaServicoTotal = totalValue - analiseMacroTotal - analise20_40Total;
    const coletaServicoPerAlq = alqueires > 0 ? coletaServicoTotal / alqueires : 0;

    return {
      totalValue,
      totalValuePerAlq,
      totalValuePerPoint,
      details: {
        jurosFactor,
        custoAnaliseFisica,
        costMethod1,
        costMethod2,
        selectedCostMethod,
        custoTalhaoCalculated,
        numAnalises20_40cm,
        custoAnalises20_40cm,
        travelCost,
        valorKmCalculated: valorKm,
        breakdown: {
          coletaServicoTotal,
          coletaServicoPerAlq,
          analiseMacroTotal,
          analiseMacroUnit: custoAnaliseFisica,
          analise20_40Total,
          analise20_40Unit: ANALISE_20_40_CM_VALOR_ANALISE,
        },
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
