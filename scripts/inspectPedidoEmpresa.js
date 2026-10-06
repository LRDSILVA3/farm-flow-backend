const XLSX = require('../../farm-flow-frontend/node_modules/xlsx');
const path = require('path');
const wb = XLSX.readFile(path.resolve(__dirname, '../../farm-flow-frontend/budget/budget.xlsm'));

const sheet = wb.Sheets['PEDIDO FOLHA EMPRESA'];
for (let r = 35; r <= 50; r++) {
  const row = [];
  for (let c = 0; c < 12; c++) {
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
