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
  indicadorFreteKmTon: number;
  indicadorTotalKmTon: number;
  indicadorCarregamentoTon: number;
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

  private getVar(code: string, fallback: number): number {
    return this.costVariables.has(code) ? this.costVariables.get(code)! : fallback;
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

    const ATV_1_PRODUTO = this.getVar('ATV_1_PRODUTO', 315);
    const ATV_2_PRODUTOS = this.getVar('ATV_2_PRODUTOS', 310);
    const ATV_3_PRODUTOS = this.getVar('ATV_3_PRODUTOS', 300);
    const VALOR_APLICACAO_ESTERCO = this.getVar('VALOR_APLICACAO_ESTERCO', 45.00);
    const DIARIA_PA_CARREGADEIRA = this.getVar('DIARIA_PA_CARREGADEIRA', 2400);
    const VALOR_KM_PRANCHA = this.getVar('VALOR_KM_DESLOCAMENTO_PRANCHA', 13);
    const VALOR_KM_DESLOCAMENTO_VAZIO = this.getVar('VALOR_KM_DESLOCAMENTO_VAZIO', 7.39);
    const DATA_BASE_CALCULO_JURO = this.getVar('DATA_BASE_CALCULO_JURO', 20251231);
    const JUROS_PAGAMENTO_PRAZO_PERCENTUAL = this.getVar('JUROS_PAGAMENTO_PRAZO_PERCENTUAL', 1.2);
    const ATV_DESCONTO_SEM_NF_PERCENTUAL = this.getVar('ATV_DESCONTO_SEM_NF_PERCENTUAL', 4.0);
    const ATV_CAPACIDADE_CAMINHAO_ESTERCO = this.getVar('ATV_CAPACIDADE_CAMINHAO_ESTERCO', 8.5);
    const ATV_CAPACIDADE_CAMINHAO_PADRAO = this.getVar('ATV_CAPACIDADE_CAMINHAO_PADRAO', 13.0);
    const ATV_RENDIMENTO_ESTERCO_DIA = this.getVar('ATV_RENDIMENTO_ESTERCO_DIA', 200);
    const ATV_RENDIMENTO_PADRAO_DIA = this.getVar('ATV_RENDIMENTO_PADRAO_DIA', 28);
    const ATV_LIMITE_DESLOCAMENTO_VAZIO_PERCENTUAL = this.getVar('ATV_LIMITE_DESLOCAMENTO_VAZIO_PERCENTUAL', 20.0);
    const ATV_LIMITE_TON_HA_DOSE_ALTA = this.getVar('ATV_LIMITE_TON_HA_DOSE_ALTA', 5.5);
    const ATV_FATOR_DOSE_ALTA = this.getVar('ATV_FATOR_DOSE_ALTA', 0.75);

    // Reads VALOR_KM_FRETE and DESPESA_VIAGEM_ATV directly if configured; falls back to diesel formula only if missing
    const valorDiesel = this.getVariableValue('VALOR_OLEO_DIESEL');
    const valorKmFrete = this.costVariables.has('VALOR_KM_FRETE')
      ? this.costVariables.get('VALOR_KM_FRETE')!
      : valorDiesel > 0
      ? Math.round(((valorDiesel / 1 * 2) / 0.94) * 100) / 100
      : 17.82;
    const despesaViagem = this.costVariables.has('DESPESA_VIAGEM_ATV')
      ? this.costVariables.get('DESPESA_VIAGEM_ATV')!
      : valorDiesel > 0
      ? 5 * 2 * 3 * valorDiesel
      : 251.25;

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
      const isEsterco =
        item.produto === 'Cama de Frango' ||
        item.produto === 'Pó de Rocha' ||
        item.produto.toLowerCase().includes('cama') ||
        item.produto.toLowerCase().includes('rocha') ||
        item.produto.toLowerCase().includes('esterco');
      const tonPorHa = item.areaHa > 0 ? item.toneladas / item.areaHa : 0;

      let precoBaseAlq = 0;
      if (isEsterco) {
        precoBaseAlq = VALOR_APLICACAO_ESTERCO;
      } else if (tonPorHa >= ATV_LIMITE_TON_HA_DOSE_ALTA) {
        precoBaseAlq = VALOR_APLICACAO_ESTERCO * ATV_FATOR_DOSE_ALTA;
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
        } else if (tonPorHa >= ATV_LIMITE_TON_HA_DOSE_ALTA) {
          investimentoATV = precoCorrigido * item.toneladas;
        } else {
          investimentoATV = precoCorrigido * areaAlq;
        }
      }

      // Frete
      let cargas = 0;
      let investimentoFrete = 0;
      if (item.cobraFrete) {
        cargas = isEsterco
          ? Math.ceil(item.toneladas / ATV_CAPACIDADE_CAMINHAO_ESTERCO)
          : Math.ceil(item.toneladas / ATV_CAPACIDADE_CAMINHAO_PADRAO);
        const distKm = item.distanciaFreteKm || distanciaIdaKm;
        const custoPorKm = cargas * distKm * 2 * valorKmFrete;
        const custoMinimoViagem = cargas * despesaViagem;
        investimentoFrete = Math.max(custoMinimoViagem, custoPorKm) * jurosFactor;
      } else {
        cargas = isEsterco
          ? Math.ceil(item.toneladas / ATV_CAPACIDADE_CAMINHAO_ESTERCO)
          : Math.ceil(item.toneladas / ATV_CAPACIDADE_CAMINHAO_PADRAO);
      }

      const diasItem = isEsterco
        ? item.toneladas / (ATV_RENDIMENTO_ESTERCO_DIA * quantosCaminhoes)
        : areaAlq / (ATV_RENDIMENTO_PADRAO_DIA * quantosCaminhoes);

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
      const fatorDescontoNF = 1 - ATV_DESCONTO_SEM_NF_PERCENTUAL / 100;
      let fatorAjuste = 1;
      if (comNotaFiscal && mapaPreciza) fatorAjuste = fatorDescontoNF;
      else if (!comNotaFiscal && mapaPreciza) fatorAjuste = fatorDescontoNF * fatorDescontoNF;
      else if (!comNotaFiscal && !mapaPreciza) fatorAjuste = fatorDescontoNF;
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
      if (custoDeslocVazio / baseServicoFrete > ATV_LIMITE_DESLOCAMENTO_VAZIO_PERCENTUAL / 100) {
        adicionalDeslocamento = custoDeslocVazio;
      }
    }

    // Desconto NF (Excel Q19)
    const descontoNF = !comNotaFiscal ? (baseServicoFrete * ATV_DESCONTO_SEM_NF_PERCENTUAL) / 100 : 0;

    const totalValue = Math.max(
      0,
      subtotalATV + subtotalFrete + custoCarregamento + adicionalDeslocamento - descontoNF - descontoManual
    );

    const precoPorAlqueire = totalAreaAlq > 0 ? Math.round((totalValue / totalAreaAlq) * 100) / 100 : 0;
    const precoPorTonelada = totalToneladas > 0 ? Math.round((totalValue / totalToneladas) * 100) / 100 : 0;
    const precoPorCarga = totalCargas > 0 ? Math.round((totalValue / totalCargas) * 100) / 100 : 0;

    // Indicadores exatos da planilha (Q26, Q27, Q28 de INPUT ATV)
    const toneladasComFrete = itens.filter(it => it.cobraFrete).reduce((sum, it) => sum + (parseFloat(it.toneladas as any) || 0), 0);
    const indicadorFreteKmTon = toneladasComFrete > 0 && distanciaIdaKm > 0
      ? Math.round((subtotalFrete / (toneladasComFrete * distanciaIdaKm)) * 100) / 100
      : 0;
    const baseServicoTotal = subtotalATV + subtotalFrete;
    const indicadorTotalKmTon = toneladasComFrete > 0 && distanciaIdaKm > 0
      ? Math.round((baseServicoTotal / (toneladasComFrete * distanciaIdaKm)) * 100) / 100
      : 0;
    const indicadorCarregamentoTon = totalToneladas > 0
      ? Math.round((custoCarregamento / totalToneladas) * 100) / 100
      : 0;

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
      indicadorFreteKmTon,
      indicadorTotalKmTon,
      indicadorCarregamentoTon,
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
