const XLSX = require('../../farm-flow-frontend/node_modules/xlsx');
const path = require('path');

const filePath = path.resolve(__dirname, '../../farm-flow-frontend/budget/budget.xlsm');
const workbook = XLSX.readFile(filePath, { cellFormula: true, cellNF: true, cellDates: false });

const dbSheet = workbook.Sheets['BANCO DE DADOS'];
console.log('--- BANCO DE DADOS ---');
for (let r = 1; r <= 35; r++) {
  const a = dbSheet[`A${r}`]?.v;
  const b = dbSheet[`B${r}`]?.v;
  const bf = dbSheet[`B${r}`]?.f;
  if (a !== undefined || b !== undefined) {
    console.log(`B${r}: ${a} = ${JSON.stringify(b)} (formula: ${bf || 'none'})`);
  }
}
