const XLSX = require('../../farm-flow-frontend/node_modules/xlsx');
const path = require('path');

const filePath = path.resolve(__dirname, '../../farm-flow-frontend/budget/budget.xlsm');
const workbook = XLSX.readFile(filePath, { cellFormula: true, cellNF: true, cellDates: false });

const sheet = workbook.Sheets['PEDIDO FOLHA CLIENTE'];
for (let r = 36; r <= 60; r++) {
  const row = [];
  for (let c = 0; c < 10; c++) {
    const colLetter = XLSX.utils.encode_col(c);
    const cellRef = `${colLetter}${r}`;
    const cell = sheet[cellRef];
    if (cell) {
      row.push(`${cellRef}: ${JSON.stringify(cell.v)} (${cell.f || ''})`);
    }
  }
  if (row.length > 0) {
    console.log(`Row ${r}:`, row.join(' ; '));
  }
}
