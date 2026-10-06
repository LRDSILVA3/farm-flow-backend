const XLSX = require('../../farm-flow-frontend/node_modules/xlsx');
const path = require('path');

const filePath = path.resolve(__dirname, '../../farm-flow-frontend/budget/budget.xlsm');
const workbook = XLSX.readFile(filePath, { cellFormula: true, cellNF: true, cellDates: false });

const sheet = workbook.Sheets['INPUT FOLHA '];
console.log('Formula E7:', sheet['E7'].f);

// Let's analyze the formula components for E7:
// IF(C7=0, 0,
//   IF($E$3="a",
//     ...
//     IF($E$4="S",
//       ((C7*'BANCO DE DADOS'!$B$8 + 'BANCO DE DADOS'!$B$12*$E$5/$B$27*B7) + B7 + 'BANCO DE DADOS'!$B$13/B$27*B7) / 0.85,
//       (C7*'BANCO DE DADOS'!$B$8 + 'BANCO DE DADOS'!$B$12*$E$5/$B$27*B7) + B7 + 'BANCO DE DADOS'!$B$13/B$27*B7
//     )
//   )
// ) * $F$2

// Variables:
// C7 = numPontos = 10
// B7 = alqueires = 10
// $B$27 = totalAlqueires = 10
// $E$3 = calculoPor = "P" (or "p")
// $E$4 = clienteDesejaNotaFiscal = "n" (or "N")
// $E$5 = distanciaFazendaKm = 10
// 'BANCO DE DADOS'!$B$8 = 430 (or wait, what is B8?)
// 'BANCO DE DADOS'!$B$12 = 4.957983... (Valor por Km)
// 'BANCO DE DADOS'!$B$13 = 330 (Valor por Viagem)
// $F$2 = jurosFactor = 1.93507596...

// Let's compute in Node!
const B8 = 430; // Wait, is B8 430?
const B12 = 4.957983193277311;
const B13 = 330;
const F2 = Math.pow(1.03, (670)/30); // 1.93507596...

const C7 = 10;
const B7 = 10;
const B27 = 10;
const E5 = 10;

// Since $E$3 = "P" and $E$4 = "n":
// (C7*'BANCO DE DADOS'!$B$8 + 'BANCO DE DADOS'!$B$12*$E$5/$B$27*B7) + B7 + 'BANCO DE DADOS'!$B$13/B$27*B7
const part1 = C7 * B8; // 10 * 430 = 4300
const travel = (B12 * E5 / B27) * B7; // 4.957983... * 10 / 10 * 10 = 49.57983...
const areaPart = B7; // 10
const tripPart = (B13 / B27) * B7; // (330 / 10) * 10 = 330
const baseCost = part1 + travel + areaPart + tripPart;
console.log('baseCost:', baseCost);
console.log('baseCost * F2:', baseCost * F2);
