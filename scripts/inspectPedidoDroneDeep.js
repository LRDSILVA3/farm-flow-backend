const XLSX = require('../../farm-flow-frontend/node_modules/xlsx');
const path = require('path');
const wb = XLSX.readFile(path.resolve(__dirname, '../../farm-flow-frontend/budget/budget.xlsm'));
const sheet = wb.Sheets['PEDIDO DRONE'];

console.log('--- PEDIDO DRONE ROWS 20 TO 45 ---');
for (let r = 20; r <= 45; r++) {
  const row = [];
  for (let c = 0; c < 15; c++) {
    const colLetter = XLSX.utils.encode_col(c);
    const ref = `${colLetter}${r}`;
    const cell = sheet[ref];
    if (cell && (cell.v !== undefined || cell.f)) {
      row.push(`${ref}: ${JSON.stringify(cell.v)} [f: ${cell.f || ''}]`);
    }
  }
  if (row.length > 0) {
    console.log(`Row ${r}:`, row.join(' ; '));
  }
}
