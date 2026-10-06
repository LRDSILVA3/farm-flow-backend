import { CostVariable } from './ConferenciaService';

export interface EqualizaParams {
  totalAlqueires: number;
  percentualAnualAP: number; // e.g., 0.33 for 33%
  incluirFolha?: boolean;
  incluirFungoNema?: boolean;
  incluirCompactacao?: boolean;
  descontoManual?: number; // e.g., 98
}

export interface EqualizaCalculationResult {
  totalAnualContrato: number;
  totalPeriodoContrato: number;
  precoPorAlqueireAnual: number;
  anosContrato: number;
  parcelaAgosto: number;
  parcelaMarco: number;
  parcelaMensal: number;
  details: {
    custoUnitarioAP: number;
    custoUnitarioConferencia: number;
    custoUnitarioFolha: number;
    custoUnitarioFungoNema: number;
    custoUnitarioCompactacao: number;
    subtotalSemDesconto: number;
    temDescontoAreaMaior100: boolean;
    descontoManual: number;
  };
}

export class EqualizaService {
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

  public calculate(params: EqualizaParams): EqualizaCalculationResult {
    const {
      totalAlqueires,
      percentualAnualAP,
      incluirFolha = false,
      incluirFungoNema = false,
      incluirCompactacao = false,
      descontoManual = 0,
    } = params;

    // Excel: K32: INT(1 / H33) -> Contract years (e.g. 1 / 0.33 = 3 years)
    const anosContrato = percentualAnualAP > 0 ? Math.floor(1 / percentualAnualAP) : 1;

    // Percentage for Conferencia = 1 - AP
    const percentualAnualConf = Math.max(0, 1 - percentualAnualAP);

    // Annual inflation / escalation factor: (1 + (0.15 * (anosContrato - 1)))
    const escalonamentoFactor = 1 + 0.15 * (anosContrato - 1);

    // Base unit rates from BANCO DE DADOS or fallback defaults
    const precoBaseAP = this.getVariableValue('TIER_1_AP_PRICE') || 295; // N7 in Excel
    const precoBaseConf = this.getVariableValue('VALOR_ALQ_CONFERENCIA') || 65; // N4 in Excel
    const precoBaseFolha = this.getVariableValue('VALOR_ALQ_FOLHA') || 60; // N10 in Excel
    const precoBaseCompactacao = this.getVariableValue('VALOR_PONTO_CONFERE_COMPACTACAO') || 430; // B8 in Excel

    // H23 in BANCO DE DADOS:
    // =$N$7*EQUALIZA!H33 + 'BANCO DE DADOS'!$N$7*EQUALIZA!H34*(1+(15%*(EQUALIZA!$K$32-1)))
    const custoUnitarioAP = Math.round(
      percentualAnualAP * (precoBaseAP * percentualAnualAP + precoBaseAP * percentualAnualConf * escalonamentoFactor)
    );

    // H24 in BANCO DE DADOS:
    const custoUnitarioConferencia = Math.round(
      percentualAnualConf * (precoBaseConf * 8 * percentualAnualAP + precoBaseConf * 8 * percentualAnualConf * escalonamentoFactor)
    );

    const custoUnitarioFolha = incluirFolha
      ? Math.round(precoBaseFolha * 0.1)
      : 0;

    const custoUnitarioFungoNema = incluirFungoNema ? 30 : 0;

    const custoUnitarioCompactacao = incluirCompactacao
      ? Math.round((precoBaseCompactacao / 10) * percentualAnualAP + (precoBaseCompactacao / 10) * percentualAnualConf * escalonamentoFactor)
      : 0;

    const somaUnitarios =
      custoUnitarioAP +
      custoUnitarioConferencia +
      custoUnitarioFolha +
      custoUnitarioFungoNema +
      custoUnitarioCompactacao;

    // Excel I41: IF(B41 >= 100, SUM(I33:I37) * 0.95, SUM(I33:I37))
    const temDescontoAreaMaior100 = totalAlqueires >= 100;
    const precoPorAlqueireAnual = temDescontoAreaMaior100 ? somaUnitarios * 0.95 : somaUnitarios;

    const subtotalAnual = precoPorAlqueireAnual * totalAlqueires;
    const totalAnualContrato = Math.max(0, subtotalAnual - descontoManual);
    const totalPeriodoContrato = totalAnualContrato * anosContrato;

    const parcelaAgosto = totalAnualContrato * 0.5;
    const parcelaMarco = totalAnualContrato * 0.5;
    const parcelaMensal = totalAnualContrato / 12;

    return {
      totalAnualContrato,
      totalPeriodoContrato,
      precoPorAlqueireAnual,
      anosContrato,
      parcelaAgosto,
      parcelaMarco,
      parcelaMensal,
      details: {
        custoUnitarioAP,
        custoUnitarioConferencia,
        custoUnitarioFolha,
        custoUnitarioFungoNema,
        custoUnitarioCompactacao,
        subtotalSemDesconto: somaUnitarios * totalAlqueires,
        temDescontoAreaMaior100,
        descontoManual,
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
