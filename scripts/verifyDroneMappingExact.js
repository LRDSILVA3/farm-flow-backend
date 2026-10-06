const { differenceInDays } = require('date-fns');

function testDroneMapping(params) {
  const {
    alqueires,
    distanciaKm,
    vencimentoServico,
    servicoFungoNematoide = true,
    servicoCurvasNivel = false,
    desconto = 0,
  } = params;

  const VOO_DRONE_ALQ_ANO = 50;
  const JUROS_DRONE_PERCENTUAL = 3.0;
  const DATA_BASE_CALCULO_JURO_DRONE = 20230130; // 44956 in Excel PEDIDO DRONE M31
  const valorDiesel = 6.9411764705882355;
  const valorKm = (valorDiesel / 7) * 2 * 2.5; // 4.957983193277311

  const [day, month, year] = vencimentoServico.split('/').map(Number);
  const vencimentoDate = new Date(year, month - 1, day);

  const yearJuro = Math.floor(DATA_BASE_CALCULO_JURO_DRONE / 10000);
  const monthJuro = Math.floor((DATA_BASE_CALCULO_JURO_DRONE % 10000) / 100);
  const dayJuro = DATA_BASE_CALCULO_JURO_DRONE % 100;
  const dataBaseJuroDate = new Date(yearJuro, monthJuro - 1, dayJuro);

  const daysDifference = differenceInDays(vencimentoDate, dataBaseJuroDate);
  const jurosFactor =
    daysDifference > 0
      ? Math.pow(1 + JUROS_DRONE_PERCENTUAL / 100, daysDifference / 30)
      : 1;

  let basePricePerAlq = 0;
  if (servicoCurvasNivel) {
    basePricePerAlq = VOO_DRONE_ALQ_ANO * 2;
  } else if (servicoFungoNematoide) {
    basePricePerAlq = VOO_DRONE_ALQ_ANO;
  }

  const precoUnitarioAlq = basePricePerAlq * jurosFactor;
  const subtotalArea = alqueires * precoUnitarioAlq;

  const precoUnitarioKm = valorKm * jurosFactor;
  const subtotalDeslocamento = distanciaKm * precoUnitarioKm;

  const totalValue = Math.max(0, subtotalArea + subtotalDeslocamento - desconto);
  const totalValuePerAlq = alqueires > 0 ? totalValue / alqueires : 0;

  return {
    precoUnitarioAlq: Number(precoUnitarioAlq.toFixed(2)),
    subtotalArea: Number(subtotalArea.toFixed(2)),
    precoUnitarioKm: Number(precoUnitarioKm.toFixed(2)),
    subtotalDeslocamento: Number(subtotalDeslocamento.toFixed(2)),
    totalValue: Number(totalValue.toFixed(2)),
    totalValuePerAlq: Number(totalValuePerAlq.toFixed(2)),
    jurosFactor: Number(jurosFactor.toFixed(4)),
    daysDifference,
  };
}

const result = testDroneMapping({
  alqueires: 10,
  distanciaKm: 10,
  vencimentoServico: '01/11/2026',
  servicoFungoNematoide: true,
  servicoCurvasNivel: false,
});

console.log('Result for User Screenshot:');
console.log(JSON.stringify(result, null, 2));
