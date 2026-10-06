import { differenceInDays } from 'date-fns';
import { CostVariable } from './ConferenciaService';

export interface ATVItemParam {
  produto: string; // 'Calc. Dolomítico' | 'Calc. Calcítico' | 'Cama de Frango' | 'Pó de Rocha' | 'Gesso' | 'KCl' | 'Outro'
  idTalhao?: string;
  areaHa: number;
  toneladas: number;
  cobraFrete: boolean;
  distanciaFreteKm?: number;
}

export interface ATVParams {
  distanciaIdaKm: number;
  vencimentoServico?: string; // DD/MM/YYYY (optional)
  quantosProdutos: number; // 1, 2, or >= 3
  quantosCaminhoes?: number; // default 2
  carregamentoNecessario?: boolean; // default true
  comNotaFiscal?: boolean; // default true
  mapaPreciza?: boolean; // default true
  clienteAlmoco?: boolean; // default false
  descontoManual?: number; // default 0
  itens: ATVItemParam[];
}

export interface ATVItemResult {
  produto: string;
  idTalhao: string;
  areaHa: number;
  areaAlq: number;
  toneladas: number;
  precoUnitarioAlq: number;
  investimentoATV: number;
  cargas: number;
  investimentoFrete: number;
  investimentoTotal: number;
}

export interface ATVCalculationResult {
  totalValue: number;
  subtotalATV: number;
  subtotalFrete: number;
  custoCarregamento: number;
  adicionalDeslocamento: number;
  descontoNF: number;
  descontoManual: number;
  diasServico: number;
  totalAreaAlq: number;
  totalToneladas: number;
  totalCargas: number;
  precoPorAlqueire: number;
  precoPorTonelada: number;
  precoPorCarga: number;
  details: {
    jurosFactor: number;
    itens: ATVItemResult[];
    carregamentoNecessario: boolean;
    comNotaFiscal: boolean;
    mapaPreciza: boolean;
    clienteAlmoco: boolean;
    quantosCaminhoes: number;
  };
}

export class ATVService {
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

  public calculate(params: ATVParams): ATVCalculationResult {
    const {
      distanciaIdaKm = 0,
      vencimentoServico,
      quantosProdutos = 1,
      quantosCaminhoes = 2,
      carregamentoNecessario = true,
      comNotaFiscal = true,
      mapaPreciza = true,
      clienteAlmoco = false,
      descontoManual = 0,
      itens = [],
    } = params;

    const ATV_1_PRODUTO = this.getVariableValue('ATV_1_PRODUTO') || 290;
    const ATV_2_PRODUTOS = this.getVariableValue('ATV_2_PRODUTOS') || 280;
    const ATV_3_PRODUTOS = this.getVariableValue('ATV_3_PRODUTOS') || 260;
    const VALOR_APLICACAO_ESTERCO = this.getVariableValue('VALOR_APLICACAO_ESTERCO') || 40.40;
    const DIARIA_PA_CARREGADEIRA = this.getVariableValue('DIARIA_PA_CARREGADEIRA') || 2600;
    const VALOR_KM_PRANCHA = this.getVariableValue('VALOR_KM_DESLOCAMENTO_PRANCHA') || 10;
    const VALOR_KM_DESLOCAMENTO_VAZIO = this.getVariableValue('VALOR_KM_DESLOCAMENTO_VAZIO') || 6.12;
    const DATA_BASE_CALCULO_JURO = this.getVariableValue('DATA_BASE_CALCULO_JURO') || 20241231;
    const JUROS_PAGAMENTO_PRAZO_PERCENTUAL = this.getVariableValue('JUROS_PAGAMENTO_PRAZO_PERCENTUAL') || 1.5;

    // Fuel derived values
    const valorDiesel = this.getVariableValue('VALOR_OLEO_DIESEL');
    let valorKmFrete = this.getVariableValue('VALOR_KM_FRETE');
    let despesaViagem = this.getVariableValue('DESPESA_VIAGEM_ATV');

    if (valorDiesel > 0) {
      valorKmFrete = Math.round(((valorDiesel / 1 * 2) / 0.94) * 100) / 100;
      despesaViagem = 5 * 2 * 3 * valorDiesel;
    } else {
      if (!valorKmFrete || valorKmFrete === 0) valorKmFrete = 14.77;
      if (!despesaViagem || despesaViagem === 0) despesaViagem = 208.24;
    }

    // Juros
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
        jurosFactor =
          Math.round(Math.pow(1 + JUROS_PAGAMENTO_PRAZO_PERCENTUAL / 100, daysDifference / 30) * 1000) / 1000;
      }
    }

    let totalAreaAlq = 0;
    let totalToneladas = 0;
    let totalCargas = 0;
    let subtotalATV = 0;
    let subtotalFrete = 0;
    let sumDiasServico = 0;

    const itemResults: ATVItemResult[] = itens.map((item) => {
      const areaAlq = Math.round((item.areaHa / 2.42) * 100) / 100;
      const isEsterco = item.produto === 'Cama de Frango' || item.produto === 'Pó de Rocha';
      const tonPorHa = item.areaHa > 0 ? item.toneladas / item.areaHa : 0;

      let precoBaseAlq = 0;
      if (isEsterco) {
        precoBaseAlq = VALOR_APLICACAO_ESTERCO;
      } else if (tonPorHa >= 5.5) {
        precoBaseAlq = VALOR_APLICACAO_ESTERCO * 0.75;
      } else if (quantosProdutos === 1) {
        precoBaseAlq = ATV_1_PRODUTO;
      } else if (quantosProdutos >= 3) {
        precoBaseAlq = ATV_3_PRODUTOS;
      } else {
        precoBaseAlq = ATV_2_PRODUTOS;
      }

      const precoCorrigido = precoBaseAlq * jurosFactor;

      let investimentoATV = 0;
      if (item.areaHa > 0) {
        if (isEsterco) {
          const valorMinimo = ATV_3_PRODUTOS * areaAlq * jurosFactor;
          investimentoATV = Math.max(valorMinimo, item.toneladas * precoCorrigido);
        } else if (tonPorHa >= 5.5) {
          investimentoATV = precoCorrigido * item.toneladas;
        } else {
          investimentoATV = precoCorrigido * areaAlq;
        }
      }

      // Frete
      let cargas = 0;
      let investimentoFrete = 0;
      if (item.cobraFrete) {
        cargas = isEsterco ? Math.ceil(item.toneladas / 8.5) : Math.ceil(item.toneladas / 13);
        const distKm = item.distanciaFreteKm || distanciaIdaKm;
        const custoPorKm = cargas * distKm * 2 * valorKmFrete;
        const custoMinimoViagem = cargas * despesaViagem;
        investimentoFrete = Math.max(custoMinimoViagem, custoPorKm) * jurosFactor;
      } else {
        cargas = isEsterco ? Math.ceil(item.toneladas / 8.5) : Math.ceil(item.toneladas / 13);
      }

      const diasItem = isEsterco
        ? item.toneladas / (200 * quantosCaminhoes)
        : areaAlq / (28 * quantosCaminhoes);

      totalAreaAlq += areaAlq;
      totalToneladas += item.toneladas;
      totalCargas += cargas;
      subtotalATV += investimentoATV;
      subtotalFrete += investimentoFrete;
      sumDiasServico += diasItem;

      return {
        produto: item.produto,
        idTalhao: item.idTalhao || '',
        areaHa: item.areaHa,
        areaAlq,
        toneladas: item.toneladas,
        precoUnitarioAlq: precoCorrigido,
        investimentoATV,
        cargas,
        investimentoFrete,
        investimentoTotal: investimentoATV + investimentoFrete,
      };
    });

    const diasServico = Math.max(1, Math.ceil(sumDiasServico));

    // Carregamento + Frete Pá Carregadeira (Excel Q21)
    let custoCarregamento = 0;
    if (carregamentoNecessario) {
      let fatorAjuste = 1;
      if (comNotaFiscal && mapaPreciza) fatorAjuste = 0.96;
      else if (!comNotaFiscal && mapaPreciza) fatorAjuste = 0.96 * 0.96;
      else if (!comNotaFiscal && !mapaPreciza) fatorAjuste = 0.96;
      else fatorAjuste = 1.0;

      const custoPa = fatorAjuste * DIARIA_PA_CARREGADEIRA * diasServico;
      const custoPrancha = VALOR_KM_PRANCHA * distanciaIdaKm * 4;
      custoCarregamento = custoPa + custoPrancha;
    }

    // Deslocamento Vazio (>20% threshold, Excel Q20)
    let adicionalDeslocamento = 0;
    const baseServicoFrete = subtotalATV + subtotalFrete;
    if (distanciaIdaKm > 0 && baseServicoFrete > 0) {
      const custoDeslocVazio = distanciaIdaKm * 2 * quantosCaminhoes * VALOR_KM_DESLOCAMENTO_VAZIO;
      if (custoDeslocVazio / baseServicoFrete > 0.20) {
        adicionalDeslocamento = custoDeslocVazio;
      }
    }

    // Desconto NF (Excel Q19)
    const descontoNF = !comNotaFiscal ? baseServicoFrete * 0.04 : 0;

    const totalValue = Math.max(
      0,
      subtotalATV + subtotalFrete + custoCarregamento + adicionalDeslocamento - descontoNF - descontoManual
    );

    const precoPorAlqueire = totalAreaAlq > 0 ? Math.round((totalValue / totalAreaAlq) * 100) / 100 : 0;
    const precoPorTonelada = totalToneladas > 0 ? Math.round((totalValue / totalToneladas) * 100) / 100 : 0;
    const precoPorCarga = totalCargas > 0 ? Math.round((totalValue / totalCargas) * 100) / 100 : 0;

    return {
      totalValue,
      subtotalATV,
      subtotalFrete,
      custoCarregamento,
      adicionalDeslocamento,
      descontoNF,
      descontoManual,
      diasServico,
      totalAreaAlq: Math.round(totalAreaAlq * 100) / 100,
      totalToneladas: Math.round(totalToneladas * 100) / 100,
      totalCargas,
      precoPorAlqueire,
      precoPorTonelada,
      precoPorCarga,
      details: {
        jurosFactor,
        itens: itemResults,
        carregamentoNecessario,
        comNotaFiscal,
        mapaPreciza,
        clienteAlmoco,
        quantosCaminhoes,
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
