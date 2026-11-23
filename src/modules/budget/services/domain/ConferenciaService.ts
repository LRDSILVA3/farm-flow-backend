import { differenceInDays } from 'date-fns';

export interface ConferenciaParams {
  clienteDesejaNotaFiscal: 'S' | 'N';
  distanciaFazendaKm: number;
  vencimentoServico: string; // Expects DD/MM/YYYY format
  desejaAnaliseFisica: 'S' | 'N';
  percentualAnalises20_40cm: number;
  percentualAnalisesBIOAS?: number; // % das Análises BIOAS (INPUT CONFERENCIA E8)
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
  numAnalisesBIOAS: number;
  custoAnalisesBIOAS: number;
  travelCost: number;
  valorKmCalculated: number;
  breakdown: {
    coletaServicoTotal: number;
    coletaServicoPerAlq: number;
    analiseMacroTotal: number;
    analiseMacroUnit: number;
    analise20_40Total: number;
    analise20_40Unit: number;
    analiseBIOASTotal: number;
    analiseBIOASUnit: number;
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

  private getVar(code: string, fallback: number): number {
    return this.costVariables.has(code) ? this.costVariables.get(code)! : fallback;
  }

  public calculate(params: ConferenciaParams): ConferenciaCalculationResult {
    let {
      distanciaFazendaKm,
      vencimentoServico,
      desejaAnaliseFisica,
      percentualAnalises20_40cm,
      percentualAnalisesBIOAS,
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

    let percBioasDecimal = percentualAnalisesBIOAS || 0;
    if (percBioasDecimal > 1 && percBioasDecimal <= 100) {
      percBioasDecimal = percBioasDecimal / 100;
    }

    const VALOR_ALQ_CONFERENCIA = this.getVar('VALOR_ALQ_CONFERENCIA', 71.666667);
    const VALOR_PONTO_CONFERE_COMPACTACAO = this.getVar('VALOR_PONTO_CONFERE_COMPACTACAO', 361.111111);
    const JUROS_PAGAMENTO_PRAZO_PERCENTUAL = this.getVar('JUROS_PAGAMENTO_PRAZO_PERCENTUAL', 1.2);
    const ANALISE_20_40_CM_VALOR_ANALISE = this.getVar('ANALISE_20_40_CM_VALOR_ANALISE', 73.90);
    const DATA_BASE_CALCULO_JURO = this.getVar('DATA_BASE_CALCULO_JURO', 20251231);
    const VALOR_ANALISE_NOVA_AREA = this.getVar('VALOR_ANALISE_NOVA_AREA', 61.40);
    const VALOR_ANALISE_ADUBO_BASE = this.getVar('VALOR_ANALISE_ADUBO_BASE', 17.50);
    const VALOR_ANALISE_ENXOFRE = this.getVar('VALOR_ANALISE_ENXOFRE', 12.50);
    const VALOR_ANALISE_FISICA_UNITARIO = this.getVar('VALOR_ANALISE_FISICA_UNITARIO', 33.30);
    const VALOR_LAB_BIOAS = this.getVar('VALOR_LAB_BIOAS', 205.20);

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

    // Parse service expiration date
    const [day, month, year] = vencimentoServico.split('/').map(Number);
    const vencimentoServicoDate = new Date(year, month - 1, day);

    // Parse DATA_BASE_CALCULO_JURO (format YYYYMMDD, default 20251231)
    const dataBaseVal = DATA_BASE_CALCULO_JURO || 20251231;
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

    // Travel cost calculation proportional to plot area (ida e volta: E4 * 2):
    // Excel: ('BANCO DE DADOS'!$B$12 * $E$4 * 2 / $B$30 * B10)
    let travelCost = 0;
    let costMethod1 = 0;
    let costMethod2 = 0;
    let selectedCostMethod = 0;

    if (alqueires > 0 && totalAlqueires > 0) {
      const travelCostPerAlqueire = (valorKm * distanciaFazendaKm * 2) / totalAlqueires;
      travelCost = travelCostPerAlqueire * alqueires;

      costMethod1 = alqueires * VALOR_ALQ_CONFERENCIA;
      costMethod2 = numAnalises * VALOR_PONTO_CONFERE_COMPACTACAO;
      selectedCostMethod = Math.max(costMethod1, costMethod2);
    }

    const servicoComJuros = (selectedCostMethod + travelCost) * jurosFactor;

    // Excel F6: Macro + S (+ Física se solicitada)
    const sumMacro = VALOR_ANALISE_NOVA_AREA + VALOR_ANALISE_ADUBO_BASE + VALOR_ANALISE_ENXOFRE;
    const custoAnaliseFisica = sumMacro + (desejaAnaliseFisica === 'S' ? VALOR_ANALISE_FISICA_UNITARIO : 0);
    const analiseMacroTotal = numAnalises * custoAnaliseFisica;

    // Excel F7: 20-40cm analyses
    // IF(E7>0, IF(C30*E7<=1, 1, ROUND(E7*C30, 0)), 0) * 'INPUT DADOS'!C23
    let numAnalises20_40cm = 0;
    if (percDecimal > 0 && numAnalises > 0) {
      numAnalises20_40cm = numAnalises * percDecimal <= 1 ? 1 : Math.round(percDecimal * numAnalises);
    }
    const analise20_40Total = numAnalises20_40cm * ANALISE_20_40_CM_VALOR_ANALISE;

    // Excel F8: BIOAS Analyses
    // IF(E8>0, IF(E8*C30<1, 1, ROUND(E8*C30, 0)), 0) * 'BANCO DE DADOS'!B48
    let numAnalisesBIOAS = 0;
    if (percBioasDecimal > 0 && numAnalises > 0) {
      numAnalisesBIOAS = numAnalises * percBioasDecimal <= 1 ? 1 : Math.round(percBioasDecimal * numAnalises);
    }
    const analiseBIOASTotal = numAnalisesBIOAS * VALOR_LAB_BIOAS;
    const custoAnalisesBIOAS = analiseBIOASTotal;

    // Excel E10 (talhão em LucasRafael.xlsm):
    // (selectedCostMethod + travelCost) * F5 + (numAnalises * F6) + F7 + F8
    const custoTalhaoCalculated = servicoComJuros + analiseMacroTotal + analise20_40Total + analiseBIOASTotal;

    // Excel F31: Linha adicional de 20-40cm somada no total E31
    // IF(E7>0, IF(C30*E7<=1, 1, ROUND(E7*C30, 0)), 0) * ('INPUT DADOS'!C23 + 'BANCO DE DADOS'!B10)
    const custoAnalises20_40cm =
      numAnalises20_40cm * (ANALISE_20_40_CM_VALOR_ANALISE + VALOR_ALQ_CONFERENCIA);

    // Total work value: Excel E31 = SUM(E10:E29) + F31
    const totalValue = custoTalhaoCalculated + custoAnalises20_40cm;
    const totalValuePerAlq = alqueires > 0 ? totalValue / alqueires : 0;
    const totalValuePerPoint = numAnalises > 0 ? totalValue / numAnalises : 0;

    // Breakdown matching PEDIDO CONFERENCIA rows 40-44:
    // Row 40: SERVIÇO DE COLETA DE ANÁLISE = E31 - J42 - J43 - J44
    const coletaServicoTotal = totalValue - analiseMacroTotal - analise20_40Total - analiseBIOASTotal;
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
        numAnalisesBIOAS,
        custoAnalisesBIOAS,
        travelCost,
        valorKmCalculated: valorKm,
        breakdown: {
          coletaServicoTotal,
          coletaServicoPerAlq,
          analiseMacroTotal,
          analiseMacroUnit: custoAnaliseFisica,
          analise20_40Total,
          analise20_40Unit: ANALISE_20_40_CM_VALOR_ANALISE,
          analiseBIOASTotal,
          analiseBIOASUnit: VALOR_LAB_BIOAS,
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
