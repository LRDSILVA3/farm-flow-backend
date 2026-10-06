function calculateATV(params) {
  const {
    distanciaIdaKm = 40,
    vencimentoServico,
    quantosProdutos = 3,
    quantosCaminhoes = 2,
    carregamentoNecessario = true,
    comNotaFiscal = true,
    mapaPreciza = true,
    descontoManual = 111.19,
    itens = [
      {
        produto: 'Calc. Dolomítico',
        idTalhao: 'TL44',
        areaHa: 72,
        toneladas: 20,
        cobraFrete: false,
      }
    ]
  } = params;

  const ATV_1_PRODUTO = 290;
  const ATV_2_PRODUTOS = 280;
  const ATV_3_PRODUTOS = 260;
  const VALOR_APLICACAO_ESTERCO = 40.40;
  const DIARIA_PA_CARREGADEIRA = 2600;
  const VALOR_KM_PRANCHA = 10;
  const VALOR_KM_DESLOCAMENTO_VAZIO = 6.12;

  // Juros
  let jurosFactor = 1;
  if (vencimentoServico) {
    const { differenceInDays } = require('date-fns');
    const [day, month, year] = vencimentoServico.split('/').map(Number);
    const vencimentoDate = new Date(year, month - 1, day);
    const dataBaseJuroDate = new Date(2024, 11, 31);
    const diff = differenceInDays(vencimentoDate, dataBaseJuroDate);
    if (diff > 0) {
      jurosFactor = Math.round(Math.pow(1.015, diff / 30) * 1000) / 1000;
    }
  }

  let totalAreaAlq = 0;
  let totalToneladas = 0;
  let totalCargas = 0;
  let subtotalATV = 0;
  let subtotalFrete = 0;
  let sumDiasServico = 0;

  const itemResults = itens.map((item) => {
    const areaAlq = Math.round((item.areaHa / 2.42) * 100) / 100;
    const isEsterco = item.produto === 'Cama de Frango' || item.produto === 'Pó de Rocha';
    const tonPorHa = item.areaHa > 0 ? item.toneladas / item.areaHa : 0;

    let precoBaseAlq = 0;
    if (isEsterco) precoBaseAlq = VALOR_APLICACAO_ESTERCO;
    else if (tonPorHa >= 5.5) precoBaseAlq = VALOR_APLICACAO_ESTERCO * 0.75;
    else if (quantosProdutos === 1) precoBaseAlq = ATV_1_PRODUTO;
    else if (quantosProdutos >= 3) precoBaseAlq = ATV_3_PRODUTOS;
    else precoBaseAlq = ATV_2_PRODUTOS;

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

    const cargas = isEsterco ? Math.ceil(item.toneladas / 8.5) : Math.ceil(item.toneladas / 13);
    const diasItem = isEsterco
      ? item.toneladas / (200 * quantosCaminhoes)
      : areaAlq / (28 * quantosCaminhoes);

    totalAreaAlq += areaAlq;
    totalToneladas += item.toneladas;
    totalCargas += cargas;
    subtotalATV += investimentoATV;
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
    };
  });

  const diasServico = Math.max(1, Math.ceil(sumDiasServico));

  // Carregamento (Pá Carregadeira)
  let custoCarregamento = 0;
  if (carregamentoNecessario) {
    let fatorAjuste = 1;
    if (comNotaFiscal && mapaPreciza) fatorAjuste = 0.96;
    else if (!comNotaFiscal && mapaPreciza) fatorAjuste = 0.96 * 0.96;
    else if (!comNotaFiscal && !mapaPreciza) fatorAjuste = 0.96;
    else fatorAjuste = 1.0;

    const custoPa = fatorAjuste * DIARIA_PA_CARREGADEIRA * diasServico;
    const custoPrancha = VALOR_KM_PRANCHA * distanciaIdaKm * 4;
    custoCarregamento = (custoPa + custoPrancha) * jurosFactor;
  }

  // Deslocamento Vazio (>20% threshold)
  let adicionalDeslocamento = 0;
  if (distanciaIdaKm > 0 && subtotalATV > 0) {
    const custoDeslocVazio = distanciaIdaKm * 2 * quantosCaminhoes * VALOR_KM_DESLOCAMENTO_VAZIO;
    if (custoDeslocVazio / subtotalATV > 0.20) {
      adicionalDeslocamento = custoDeslocVazio * jurosFactor;
    }
  }

  // Desconto NF
  const descontoNF = !comNotaFiscal ? subtotalATV * 0.04 : 0;

  const totalValue = Math.max(0, subtotalATV + subtotalFrete + custoCarregamento + adicionalDeslocamento - descontoNF - descontoManual);
  const precoPorAlqueire = totalAreaAlq > 0 ? totalValue / totalAreaAlq : 0;
  const precoPorTonelada = totalToneladas > 0 ? totalValue / totalToneladas : 0;
  const precoPorCarga = totalCargas > 0 ? totalValue / totalCargas : 0;

  return {
    totalValue: Number(totalValue.toFixed(2)),
    subtotalATV: Number(subtotalATV.toFixed(2)),
    custoCarregamento: Number(custoCarregamento.toFixed(2)),
    adicionalDeslocamento: Number(adicionalDeslocamento.toFixed(2)),
    descontoNF: Number(descontoNF.toFixed(2)),
    descontoManual: Number(descontoManual.toFixed(2)),
    diasServico,
    totalAreaAlq: Number(totalAreaAlq.toFixed(2)),
    totalToneladas: Number(totalToneladas.toFixed(2)),
    totalCargas,
    precoPorAlqueire: Number(precoPorAlqueire.toFixed(2)),
    precoPorTonelada: Number(precoPorTonelada.toFixed(2)),
    precoPorCarga: Number(precoPorCarga.toFixed(2)),
    itens: itemResults,
  };
}

const res = calculateATV({});
console.log(JSON.stringify(res, null, 2));
