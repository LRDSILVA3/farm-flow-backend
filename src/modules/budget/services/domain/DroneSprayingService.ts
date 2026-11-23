import { differenceInDays, endOfMonth } from 'date-fns';
import { CostVariable } from './ConferenciaService';

export interface DroneSprayingParams {
  areaHa: number;
  numObstaculos?: number;
  metrosBeiraMato?: number;
  metrosFiosLuz?: number;
  numPontosRTK?: number;
  distanciaKm: number;
  isProgramada: boolean;
  isJaMapeada: boolean;
  tipoSolidoOuLiquido: 'S' | 'L';
  doseSolidoKgAlq?: number;
  comNotaFiscal: boolean;
  vencimentoServico: string; // DD/MM/YYYY
}

export interface DroneSprayingCalculationResult {
  totalValue: number;
  precoPorAlqueire: number;
  areaAlqueires: number;
  details: {
    jurosFactor: number;
    deslocamentoServico: number;
    deslocamentoMapeamento: number;
    custoObstaculos: number;
    custoBeiraMato: number;
    custoFiosLuz: number;
    custoRTK: number;
    fatorDoseSolido: number;
    fatorImposto: number;
    valorKmCalculated: number;
  };
}

export class DroneSprayingService {
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

  public calculate(params: DroneSprayingParams): DroneSprayingCalculationResult {
    const {
      areaHa,
      numObstaculos = 0,
      metrosBeiraMato = 0,
      metrosFiosLuz = 0,
      numPontosRTK = 0,
      distanciaKm,
      isProgramada,
      isJaMapeada,
      tipoSolidoOuLiquido,
      doseSolidoKgAlq = 0,
      comNotaFiscal,
      vencimentoServico,
    } = params;

    const DRONE_PULVE_BASE_ALQ = this.getVar('DRONE_PULVE_BASE_ALQ', 240);
    const DRONE_PULVE_PRECO_MINIMO_ALQ = this.getVar('DRONE_PULVE_PRECO_MINIMO_ALQ', 270);
    const DRONE_PULVE_PRECO_PROGRAMADA = this.getVar('DRONE_PULVE_PRECO_PROGRAMADA', 240);
    const DRONE_VALOR_OBSTACULO = this.getVar('DRONE_VALOR_OBSTACULO', 100);
    const DRONE_VALOR_BEIRA_MATO = this.getVar('DRONE_VALOR_BEIRA_MATO', 0.50);
    const DRONE_VALOR_FIO_LUZ = this.getVar('DRONE_VALOR_FIO_LUZ', 1.00);
    const DRONE_VALOR_PONTO_RTK = this.getVar('DRONE_VALOR_PONTO_RTK', 500);
    const DRONE_LIMITE_DOSE_SOLIDO_KG_ALQ = this.getVar('DRONE_LIMITE_DOSE_SOLIDO_KG_ALQ', 100);
    const JUROS_PAGAMENTO_PRAZO_PERCENTUAL = this.getVar('JUROS_PAGAMENTO_PRAZO_PERCENTUAL', 1.2);

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

    const areaAlqueires = areaHa > 0 ? areaHa / 2.42 : 0;

    // Excel B15: $ em deslocamento serviço
    const deslocamentoServico = distanciaKm * valorKm;

    // Excel B17-B20: adicionais de complexidade
    const custoObstaculos = numObstaculos * DRONE_VALOR_OBSTACULO;
    const custoBeiraMato = metrosBeiraMato * DRONE_VALOR_BEIRA_MATO;
    const custoFiosLuz = metrosFiosLuz * DRONE_VALOR_FIO_LUZ;
    const custoRTK = numPontosRTK * DRONE_VALOR_PONTO_RTK;

    // Excel B16: $ em deslocamento mapeamento + ortomosaico
    const deslocamentoMapeamento = !isJaMapeada && areaAlqueires > 0
      ? (distanciaKm * valorKm) + 0.05 * DRONE_PULVE_BASE_ALQ * areaAlqueires + 0.1 * custoObstaculos + 0.1 * custoRTK
      : 0;

    // Excel B22 & B23
    const totaisIntermediario =
      DRONE_PULVE_BASE_ALQ * areaAlqueires +
      custoRTK +
      custoFiosLuz +
      custoBeiraMato +
      custoObstaculos +
      deslocamentoServico;

    const alqIntermediario = areaAlqueires > 0 ? totaisIntermediario / areaAlqueires : 0;

    // Excel B24: R$/alq corrigido
    let alqCorrigido = 0;
    if (areaAlqueires > 0) {
      if (isProgramada) {
        alqCorrigido = DRONE_PULVE_PRECO_PROGRAMADA + (deslocamentoServico / areaAlqueires);
      } else {
        const baseCalculada = Math.max(DRONE_PULVE_PRECO_MINIMO_ALQ, alqIntermediario);
        alqCorrigido = baseCalculada + (deslocamentoMapeamento / areaAlqueires);
      }
    }

    // Excel B25: Corrigindo valor pela dose de solido (BANCO DE DADOS!B41)
    let fatorDoseSolido = 1;
    if (tipoSolidoOuLiquido === 'S') {
      if (doseSolidoKgAlq > DRONE_LIMITE_DOSE_SOLIDO_KG_ALQ) {
        fatorDoseSolido = 0.0055 * doseSolidoKgAlq + 0.45;
      }
    }

    // Excel B26: Juro do Financeiro
    const DATA_BASE_CALCULO_JURO_DRONE =
      this.getVariableValue('DATA_BASE_CALCULO_JURO_DRONE') ||
      this.getVariableValue('DATA_BASE_CALCULO_JURO');

    const [day, month, year] = vencimentoServico.split('/').map(Number);
    const vencimentoDate = new Date(year, month - 1, day);

    let baseDate: Date;
    if (DATA_BASE_CALCULO_JURO_DRONE > 0) {
      const yearJuro = Math.floor(DATA_BASE_CALCULO_JURO_DRONE / 10000);
      const monthJuro = Math.floor((DATA_BASE_CALCULO_JURO_DRONE % 10000) / 100);
      const dayJuro = DATA_BASE_CALCULO_JURO_DRONE % 100;
      baseDate = new Date(yearJuro, monthJuro - 1, dayJuro);
    } else {
      baseDate = endOfMonth(new Date());
    }

    const daysDiff = differenceInDays(vencimentoDate, baseDate);
    const jurosFactor =
      daysDiff > 0
        ? Math.pow(1 + JUROS_PAGAMENTO_PRAZO_PERCENTUAL / 100, daysDiff / 30)
        : 1;

    // Excel B27: Fator de correção pra sólido (0.9 se sólido, BANCO DE DADOS!B38)
    const DRONE_FATOR_SOLIDO = this.getVar('DRONE_FATOR_SOLIDO', 0.9);
    const fatorSolidoBase = tipoSolidoOuLiquido === 'S' ? DRONE_FATOR_SOLIDO : 1;

    // Excel B28: Correção imposto (0.93 se sem NF)
    const FATOR_SEM_NOTA_FISCAL = this.getVar('FATOR_SEM_NOTA_FISCAL', 0.93);
    const fatorImposto = comNotaFiscal ? 1 : FATOR_SEM_NOTA_FISCAL;

    // Excel B30: R$/Alq final
    const adicionalMapeamentoSolido =
      tipoSolidoOuLiquido === 'S' && areaAlqueires > 0
        ? (deslocamentoMapeamento / areaAlqueires) * 0.1
        : 0;

    const precoPorAlqueire =
      alqCorrigido *
        fatorDoseSolido *
        jurosFactor *
        fatorSolidoBase *
        fatorImposto +
      adicionalMapeamentoSolido;

    const totalValue = precoPorAlqueire * Math.round(areaAlqueires * 10) / 10;

    return {
      totalValue,
      precoPorAlqueire,
      areaAlqueires,
      details: {
        jurosFactor,
        deslocamentoServico,
        deslocamentoMapeamento,
        custoObstaculos,
        custoBeiraMato,
        custoFiosLuz,
        custoRTK,
        fatorDoseSolido,
        fatorImposto,
        valorKmCalculated: valorKm,
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
