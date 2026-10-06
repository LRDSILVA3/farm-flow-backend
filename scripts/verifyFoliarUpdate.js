const { differenceInDays } = require('date-fns');

function calculateFoliar(params) {
  let {
    calculoPor,
    clienteDesejaNotaFiscal,
    distanciaFazendaKm,
    vencimentoServico,
    alqueires,
    totalAlqueires,
    numPontos,
  } = params;

  if (!totalAlqueires || totalAlqueires <= 0) {
    totalAlqueires = alqueires;
  }

  const VALOR_ALQ_FOLHA = 60;
  const VALOR_PONTO_CONFERE_COMPACTACAO = 430;
  const VALOR_ANALISE_FOLIAR = 70;
  const VALOR_VIAGEM_CONFERENCIA_FOLHA = 330;
  const JUROS_FOLIAR_PERCENTUAL = 3.0; // 3.0% per month
  const DATA_BASE_CALCULO_JURO = 20241231;

  const valorDiesel = 6.9411764705882355;
  const valorKm = (valorDiesel / 7) * 2 * 2.5; // 4.957983193277311

  // Parse dates
  const [day, month, year] = vencimentoServico.split('/').map(Number);
  const vencimentoDate = new Date(year, month - 1, day);

  const yearJuro = Math.floor(DATA_BASE_CALCULO_JURO / 10000);
  const monthJuro = Math.floor((DATA_BASE_CALCULO_JURO % 10000) / 100);
  const dayJuro = DATA_BASE_CALCULO_JURO % 100;
  const dataBaseJuroDate = new Date(yearJuro, monthJuro - 1, dayJuro);

  const daysDifference = differenceInDays(vencimentoDate, dataBaseJuroDate);
  const jurosFactor =
    daysDifference > 0
      ? Math.pow(1 + JUROS_FOLIAR_PERCENTUAL / 100, daysDifference / 30)
      : 1;

  // Travel cost
  const travelCostPerAlq = totalAlqueires > 0 ? (valorKm * distanciaFazendaKm) / totalAlqueires : 0;
  const travelCost = travelCostPerAlq * alqueires;

  let custoBase = 0;
  if (numPontos > 0 && alqueires > 0) {
    if (calculoPor === 'A') {
      const baseCost = alqueires * VALOR_ALQ_FOLHA + travelCost;
      if (clienteDesejaNotaFiscal === 'S') {
        custoBase = baseCost < VALOR_PONTO_CONFERE_COMPACTACAO ? VALOR_PONTO_CONFERE_COMPACTACAO : baseCost;
      } else {
        const minNoNf = VALOR_PONTO_CONFERE_COMPACTACAO * 0.93;
        custoBase = baseCost < minNoNf ? minNoNf : baseCost * 0.93;
      }
    } else {
      const viagemCost = totalAlqueires > 0 ? (VALOR_VIAGEM_CONFERENCIA_FOLHA / totalAlqueires) * alqueires : 0;
      const baseCost = numPontos * VALOR_PONTO_CONFERE_COMPACTACAO + travelCost + alqueires + viagemCost;
      if (clienteDesejaNotaFiscal === 'S') {
        custoBase = baseCost / 0.85;
      } else {
        custoBase = baseCost;
      }
    }
  }

  const totalValue = custoBase * jurosFactor;
  const custoLaboratorial = numPontos * VALOR_ANALISE_FOLIAR;
  const custoCampoCalculado = Math.max(0, totalValue - custoLaboratorial);

  return {
    totalValue: Number(totalValue.toFixed(2)),
    totalValuePerAlq: Number((totalValue / alqueires).toFixed(2)),
    totalValuePerPoint: Number((totalValue / numPontos).toFixed(2)),
    details: {
      jurosFactor: Number(jurosFactor.toFixed(4)),
      travelCost: Number(travelCost.toFixed(2)),
      valorKmCalculated: Number(valorKm.toFixed(2)),
      custoCampoCalculado: Number(custoCampoCalculado.toFixed(2)),
      custoLaboratorial: Number(custoLaboratorial.toFixed(2)),
      numPontos,
      alqueires,
    },
  };
}

const res = calculateFoliar({
  calculoPor: 'P',
  clienteDesejaNotaFiscal: 'N',
  distanciaFazendaKm: 10,
  vencimentoServico: '01/11/2026',
  alqueires: 10,
  totalAlqueires: 10,
  numPontos: 10,
});

console.log('Simulation Result:');
console.log(JSON.stringify(res, null, 2));
