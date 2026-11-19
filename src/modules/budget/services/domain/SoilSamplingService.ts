import { differenceInDays } from 'date-fns';
import { CostVariable } from './ConferenciaService';

export interface SoilSamplingParams {
  isReanalise: boolean;
  comNotaFiscal: boolean;
  alqueires: number;
  numPontos: number;
  vencimentoServico?: string; // DD/MM/YYYY (opcional)
  desejaAduboBase?: boolean;
  desejaEnxofre?: boolean;
  desejaMicronutrientes?: boolean;
  desejaAnalise20_40cm?: boolean;
  desejaAnaliseFisica?: boolean;
  descontoManual?: number; // Desconto em R$
  descontoPercentualManual?: number; // Desconto em %
  valorFechadoManual?: number; // Valor Total Fechado em R$
}

export interface SoilSamplingCalculationResult {
  totalValue: number; // Valor Total Fechado (B9 / Total do pedido)
  valorTotalSugerido: number; // Valor Total Sugerido (B8 / Linha 40 do pedido)
  desconto: number; // Desconto em R$
  descontoPercentual: number; // % do desconto
  totalValuePerAlq: number; // R$/alq fechado
  totalValuePerPoint: number; // R$/ponto fechado
  sugeridoPerAlq: number; // R$/alq sugerido
  sugeridoPerPoint: number; // R$/ponto sugerido
  details: {
    jurosFactor: number;
    precoAlqServico: number;
    totalServicoAlq: number;
    valorUnitarioAnalise: number;
    totalAnalises: number;
    numAnalises20_40cm: number;
    numAnalisesFisicas: number;
    numAnalisesCompleta: number;
    numAnalisesMacro: number;
    percAnalisesCompleta: number;
    percAnalisesMacro: number;
    valorTeoricoAnaliseUnit: number;
    custoCampoCalculado: number;
    saldoAnalisesTotal: number;
    fatorDescontoAnalise: number;
    numMinimoAnalises: number;
    hectares: number;
    haPorPonto: number;
    determinationsSummary: string;
  };
}

export class SoilSamplingService {
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

  public calculate(params: SoilSamplingParams): SoilSamplingCalculationResult {
    const {
      isReanalise,
      comNotaFiscal,
      alqueires,
      numPontos,
      vencimentoServico,
      desejaAduboBase = true,
      desejaEnxofre = true,
      desejaMicronutrientes = true,
      desejaAnalise20_40cm = true,
      desejaAnaliseFisica = false,
      descontoManual,
      descontoPercentualManual,
      valorFechadoManual,
    } = params;

    const AP_ATE_50_ALQ = this.getVariableValue('AP_ATE_50_ALQ') || 345.124551;
    const AP_50_A_100_ALQ = this.getVariableValue('AP_50_A_100_ALQ') || 325.589199;
    const AP_MAIS_100_ALQ = this.getVariableValue('AP_MAIS_100_ALQ') || 307.159622;

    const REANALISE_ATE_50_ALQ = this.getVariableValue('REANALISE_ATE_50_ALQ') || 330.124551;
    const REANALISE_50_A_100_ALQ = this.getVariableValue('REANALISE_50_A_100_ALQ') || 311.438256;
    const REANALISE_MAIS_100_ALQ = this.getVariableValue('REANALISE_MAIS_100_ALQ') || 293.809675;

    const VALOR_PONTO_CONFERE_COMPACTACAO = this.getVariableValue('VALOR_PONTO_CONFERE_COMPACTACAO') || 361.111111;
    const VALOR_ANALISE_NOVA_AREA = this.getVariableValue('VALOR_ANALISE_NOVA_AREA') || 61.40;
    const VALOR_ANALISE_ADUBO_BASE = this.getVariableValue('VALOR_ANALISE_ADUBO_BASE') || 17.50;
    const VALOR_ANALISE_ENXOFRE = this.getVariableValue('VALOR_ANALISE_ENXOFRE') || 12.50;
    const VALOR_ANALISE_MICRONUTRIENTES = this.getVariableValue('VALOR_ANALISE_MICRONUTRIENTES') || 29.55;
    const ANALISE_20_40_CM_VALOR_ANALISE = this.getVariableValue('ANALISE_20_40_CM_VALOR_ANALISE') || 73.90;
    const VALOR_ANALISE_FISICA_UNITARIO = this.getVariableValue('VALOR_ANALISE_FISICA_UNITARIO') || 33.30;

    const DATA_BASE_CALCULO_JURO = this.getVariableValue('DATA_BASE_CALCULO_JURO') || 20251231;
    const JUROS_PAGAMENTO_PRAZO_PERCENTUAL = this.getVariableValue('JUROS_PAGAMENTO_PRAZO_PERCENTUAL') || 1.2;
    const DESCONTO_SEM_FORMULA_ADUBO = this.getVariableValue('DESCONTO_SEM_FORMULA_ADUBO') || 0.8;

    // Minimum number of analyses: Excel INPUT DADOS B15
    let numMinimoAnalises = 0;
    if (alqueires > 0) {
      if (alqueires < 5) {
        numMinimoAnalises = Math.floor(alqueires) + 1;
      } else if (alqueires < 10) {
        numMinimoAnalises = Math.floor((alqueires * 2.42) / 2.5) + 1;
      } else {
        numMinimoAnalises = Math.floor((alqueires * 2.42) / 3) + 1;
      }
    }

    // Parse dates and calculate interest factor
    let jurosFactor = 1;
    let jurosFactorUnrounded = 1;
    if (vencimentoServico && vencimentoServico.trim() !== '') {
      const [day, month, year] = vencimentoServico.split('/').map(Number);
      const vencimentoDate = new Date(year, month - 1, day);

      const yearJuro = Math.floor(DATA_BASE_CALCULO_JURO / 10000);
      const monthJuro = Math.floor((DATA_BASE_CALCULO_JURO % 10000) / 100);
      const dayJuro = DATA_BASE_CALCULO_JURO % 100;
      const dataBaseJuroDate = new Date(yearJuro, monthJuro - 1, dayJuro);

      const daysDifference = differenceInDays(vencimentoDate, dataBaseJuroDate);
      if (daysDifference > 0) {
        jurosFactorUnrounded = Math.pow(1 + JUROS_PAGAMENTO_PRAZO_PERCENTUAL / 100, daysDifference / 30);
        jurosFactor = Math.round(jurosFactorUnrounded * 1000) / 1000;
      }
    }

    // Base price from area tiers
    let basePricePerAlq = 0;
    if (!isReanalise) {
      if (alqueires >= 100) basePricePerAlq = AP_MAIS_100_ALQ;
      else if (alqueires < 50) basePricePerAlq = AP_ATE_50_ALQ;
      else basePricePerAlq = AP_50_A_100_ALQ;
    } else {
      if (alqueires >= 100) basePricePerAlq = REANALISE_MAIS_100_ALQ;
      else if (alqueires < 50) basePricePerAlq = REANALISE_ATE_50_ALQ;
      else basePricePerAlq = REANALISE_50_A_100_ALQ;
    }

    const FATOR_SEM_NOTA_FISCAL = this.getVariableValue('FATOR_SEM_NOTA_FISCAL') || 0.93;
    if (!comNotaFiscal) {
      basePricePerAlq *= FATOR_SEM_NOTA_FISCAL;
    }

    let precoAlqServico = basePricePerAlq * jurosFactorUnrounded;
    if (!desejaAduboBase) {
      precoAlqServico *= DESCONTO_SEM_FORMULA_ADUBO;
    }
    const totalServicoAlq = alqueires * precoAlqServico;

    // Unit value of chemical analyses:
    let valorUnitarioAnalise = VALOR_ANALISE_NOVA_AREA;
    if (desejaAduboBase) valorUnitarioAnalise += VALOR_ANALISE_ADUBO_BASE;
    if (desejaEnxofre) valorUnitarioAnalise += VALOR_ANALISE_ENXOFRE;
    if (desejaMicronutrientes) valorUnitarioAnalise += VALOR_ANALISE_MICRONUTRIENTES;

    // 20-40cm analyses (only when area and points are positive)
    const numAnalises20_40cm =
      desejaAnalise20_40cm && alqueires > 0 && numPontos > 0
        ? (numPontos / 10 < 1 ? 1 : Math.round(numPontos / 10))
        : 0;
    const total20_40cm = numAnalises20_40cm * ANALISE_20_40_CM_VALOR_ANALISE;

    // Physical analyses
    const hectares = alqueires * 2.42;
    const numAnalisesFisicas = desejaAnaliseFisica
      ? Math.ceil(hectares / 50)
      : 0;
    const totalFisicas = numAnalisesFisicas * VALOR_ANALISE_FISICA_UNITARIO;

    const totalAnalises = numPontos * valorUnitarioAnalise + total20_40cm + totalFisicas;

    // Excel B7: Theoretical unit value of analyses including subsuperficial and physical
    const valorTeoricoAnaliseUnit =
      valorUnitarioAnalise + (numPontos > 0 ? (total20_40cm + totalFisicas) / numPontos : 0);

    // Total calculation: Excel B8 compares area method vs point method
    // In LucasRafael.xlsm (2026):
    // IF((B5*B12 + B6*B7)*D10 > ((B6+B23)*'BANCO DE DADOS'!B8*0.4 + (B6+B23)*B7*0.7)*D10,
    //    (B5*B12 + B6*B7)*D10,
    //    ((B23+B6)*0.4*'BANCO DE DADOS'!B8 + (B6+B23)*B7*0.7)*D10)
    const metodo1 = (totalServicoAlq + totalAnalises) * jurosFactor;
    const metodo2 =
      ((numPontos + numAnalises20_40cm) * VALOR_PONTO_CONFERE_COMPACTACAO * 0.4 +
        (numPontos + numAnalises20_40cm) * valorTeoricoAnaliseUnit * 0.7) *
      jurosFactor;

    const valorTotalSugerido = alqueires > 0 ? Math.max(metodo1, metodo2) : 0;

    // Desconto padrão da variável de custo se não houver desconto ou valor fechado informado manualmente
    const defaultDiscountPercent = this.getVariableValue('DESCONTO_COMERCIAL_PADRAO_PERCENTUAL') || 0;

    let desconto = 0;
    let totalValue = valorTotalSugerido;

    if (valorFechadoManual !== undefined && valorFechadoManual !== null && valorFechadoManual > 0) {
      totalValue = valorFechadoManual;
      desconto = Math.max(0, valorTotalSugerido - totalValue);
    } else if (descontoManual !== undefined && descontoManual !== null && descontoManual > 0) {
      desconto = descontoManual;
      totalValue = Math.max(0, valorTotalSugerido - desconto);
    } else if (descontoPercentualManual !== undefined && descontoPercentualManual !== null && descontoPercentualManual > 0) {
      desconto = (valorTotalSugerido * descontoPercentualManual) / 100;
      totalValue = Math.max(0, valorTotalSugerido - desconto);
    } else if (defaultDiscountPercent > 0) {
      desconto = (valorTotalSugerido * defaultDiscountPercent) / 100;
      totalValue = Math.max(0, valorTotalSugerido - desconto);
    }

    const descontoPercentual = valorTotalSugerido > 0 ? (desconto / valorTotalSugerido) * 100 : 0;
    const totalValuePerAlq = alqueires > 0 ? totalValue / alqueires : 0;
    const totalValuePerPoint = numPontos > 0 ? totalValue / numPontos : 0;
    const sugeridoPerAlq = alqueires > 0 ? valorTotalSugerido / alqueires : 0;
    const sugeridoPerPoint = numPontos > 0 ? valorTotalSugerido / numPontos : 0;
    const haPorPonto = numPontos > 0 ? hectares / numPontos : 0;

    // Excel C12: Field service cost (B12 * B5 in LucasRafael.xlsm)
    const custoCampoCalculado = totalServicoAlq;

    // Excel C13: Net budget available for lab analyses (B9 - C12)
    const saldoAnalisesTotal = totalValue - custoCampoCalculado;
    const valorAnalisePorPontoFechado = numPontos > 0 ? saldoAnalisesTotal / numPontos : 0;

    // Excel C14: Relative discount factor on lab analyses
    const fatorDescontoAnalise =
      valorTeoricoAnaliseUnit > 0
        ? (valorAnalisePorPontoFechado - valorTeoricoAnaliseUnit) / valorTeoricoAnaliseUnit
        : 0;

    // In LucasRafael.xlsm (2026) / budget.xlsm:
    // Without commercial discount (B9 >= B8), 100% of analyses are complete.
    // With commercial discount, standard baseline is 40% Completa and 60% Macro Simples (B17 = 40 in LucasRafael.xlsm).
    const PERC_COMPLETA_COM_DESCONTO_PADRAO =
      this.getVariableValue('PERC_COMPLETA_COM_DESCONTO_PADRAO') || 40;
    const percAnalisesCompleta = desconto <= 0 ? 100 : PERC_COMPLETA_COM_DESCONTO_PADRAO;
    const percAnalisesMacro = 100 - percAnalisesCompleta;

    // Excel B21 & B22: Number of Complete vs Macro analyses
    const numAnalisesCompleta =
      numPontos > 0
        ? (percAnalisesCompleta < 20
            ? Math.round(0.20 * numPontos)
            : Math.floor((percAnalisesCompleta * numPontos) / 100))
        : 0;
    const numAnalisesMacro = Math.max(0, numPontos - numAnalisesCompleta);

    const determinationsParts: string[] = [];
    if (desejaAduboBase) determinationsParts.push('ADUBAÇÃO DE BASE');
    if (desejaEnxofre) determinationsParts.push('ENXOFRE');
    if (desejaMicronutrientes) determinationsParts.push('MICRO');
    if (desejaAnalise20_40cm) determinationsParts.push('ANÁLISE DE 20-40CM');
    if (desejaAnaliseFisica) determinationsParts.push('FÍSICA');
    const determinationsSummary = determinationsParts.join(', ');

    return {
      totalValue,
      valorTotalSugerido,
      desconto,
      descontoPercentual,
      totalValuePerAlq,
      totalValuePerPoint,
      sugeridoPerAlq,
      sugeridoPerPoint,
      details: {
        jurosFactor,
        precoAlqServico,
        totalServicoAlq,
        valorUnitarioAnalise,
        totalAnalises,
        numAnalises20_40cm,
        numAnalisesFisicas,
        numAnalisesCompleta,
        numAnalisesMacro,
        percAnalisesCompleta,
        percAnalisesMacro,
        valorTeoricoAnaliseUnit,
        custoCampoCalculado,
        saldoAnalisesTotal,
        fatorDescontoAnalise,
        numMinimoAnalises,
        hectares,
        haPorPonto,
        determinationsSummary,
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
