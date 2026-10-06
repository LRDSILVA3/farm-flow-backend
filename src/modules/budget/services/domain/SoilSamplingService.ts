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
      valorFechadoManual,
    } = params;

    const AP_ATE_50_ALQ = this.getVariableValue('AP_ATE_50_ALQ') || 295;
    const AP_50_A_100_ALQ = this.getVariableValue('AP_50_A_100_ALQ') || 278.30;
    const AP_MAIS_100_ALQ = this.getVariableValue('AP_MAIS_100_ALQ') || 262.55;

    const REANALISE_ATE_50_ALQ = this.getVariableValue('REANALISE_ATE_50_ALQ') || 280;
    const REANALISE_50_A_100_ALQ = this.getVariableValue('REANALISE_50_A_100_ALQ') || 264.15;
    const REANALISE_MAIS_100_ALQ = this.getVariableValue('REANALISE_MAIS_100_ALQ') || 249.20;

    const VALOR_PONTO_CONFERE_COMPACTACAO = this.getVariableValue('VALOR_PONTO_CONFERE_COMPACTACAO') || 430;
    const VALOR_ANALISE_NOVA_AREA = this.getVariableValue('VALOR_ANALISE_NOVA_AREA') || 52.30;
    const VALOR_ANALISE_ADUBO_BASE = this.getVariableValue('VALOR_ANALISE_ADUBO_BASE') || 35.30;
    const VALOR_ANALISE_ENXOFRE = this.getVariableValue('VALOR_ANALISE_ENXOFRE') || 17.70;
    const VALOR_ANALISE_MICRONUTRIENTES = this.getVariableValue('VALOR_ANALISE_MICRONUTRIENTES') || 20.00;
    const ANALISE_20_40_CM_VALOR_ANALISE = this.getVariableValue('ANALISE_20_40_CM_VALOR_ANALISE') || 70.00;
    const VALOR_ANALISE_FISICA_UNITARIO = this.getVariableValue('VALOR_ANALISE_FISICA_UNITARIO') || 42.30;

    const DATA_BASE_CALCULO_JURO = this.getVariableValue('DATA_BASE_CALCULO_JURO') || 20241231;
    const JUROS_PAGAMENTO_PRAZO_PERCENTUAL = this.getVariableValue('JUROS_PAGAMENTO_PRAZO_PERCENTUAL') || 1.5;

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
    if (vencimentoServico && vencimentoServico.trim() !== '') {
      const [day, month, year] = vencimentoServico.split('/').map(Number);
      const vencimentoDate = new Date(year, month - 1, day);

      const yearJuro = Math.floor(DATA_BASE_CALCULO_JURO / 10000);
      const monthJuro = Math.floor((DATA_BASE_CALCULO_JURO % 10000) / 100);
      const dayJuro = DATA_BASE_CALCULO_JURO % 100;
      const dataBaseJuroDate = new Date(yearJuro, monthJuro - 1, dayJuro);

      const daysDifference = differenceInDays(vencimentoDate, dataBaseJuroDate);
      if (daysDifference > 0) {
        jurosFactor = Math.pow(1 + JUROS_PAGAMENTO_PRAZO_PERCENTUAL / 100, daysDifference / 30);
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

    if (!comNotaFiscal) {
      basePricePerAlq *= 0.93;
    }

    const precoAlqServico = basePricePerAlq * jurosFactor;
    const totalServicoAlq = alqueires * precoAlqServico;

    // Unit value of chemical analyses:
    let valorUnitarioAnalise = VALOR_ANALISE_NOVA_AREA;
    if (desejaAduboBase) valorUnitarioAnalise += VALOR_ANALISE_ADUBO_BASE;
    if (desejaEnxofre) valorUnitarioAnalise += VALOR_ANALISE_ENXOFRE;
    if (desejaMicronutrientes) valorUnitarioAnalise += VALOR_ANALISE_MICRONUTRIENTES;

    // 20-40cm analyses
    const numAnalises20_40cm = desejaAnalise20_40cm
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

    // Total calculation: Excel B8 compares area method vs point method
    const metodo1 = totalServicoAlq + totalAnalises;
    const metodo2 =
      (numPontos + numAnalises20_40cm) * VALOR_PONTO_CONFERE_COMPACTACAO * 0.4 * jurosFactor +
      (numPontos + numAnalises20_40cm) * valorUnitarioAnalise * 0.7;

    const valorTotalSugerido = Math.max(metodo1, metodo2);

    let desconto = 0;
    let totalValue = valorTotalSugerido;

    if (valorFechadoManual !== undefined && valorFechadoManual !== null && valorFechadoManual > 0) {
      totalValue = valorFechadoManual;
      desconto = Math.max(0, valorTotalSugerido - totalValue);
    } else if (descontoManual !== undefined && descontoManual !== null && descontoManual > 0) {
      desconto = descontoManual;
      totalValue = Math.max(0, valorTotalSugerido - desconto);
    }

    const descontoPercentual = valorTotalSugerido > 0 ? (desconto / valorTotalSugerido) * 100 : 0;
    const totalValuePerAlq = alqueires > 0 ? totalValue / alqueires : 0;
    const totalValuePerPoint = numPontos > 0 ? totalValue / numPontos : 0;
    const sugeridoPerAlq = alqueires > 0 ? valorTotalSugerido / alqueires : 0;
    const sugeridoPerPoint = numPontos > 0 ? valorTotalSugerido / numPontos : 0;
    const haPorPonto = numPontos > 0 ? hectares / numPontos : 0;

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
