const XLSX = require('../../farm-flow-frontend/node_modules/xlsx');
const path = require('path');
const wb = XLSX.readFile(path.resolve(__dirname, '../../farm-flow-frontend/budget/budget.xlsm'));
const sheet = wb.Sheets['PEDIDO DRONE'];
for (let r = 25; r <= 36; r++) {
  for (let c = 10; c <= 14; c++) {
    const ref = XLSX.utils.encode_col(c) + r;
    if (sheet[ref]) {
      console.log(ref, ':', JSON.stringify(sheet[ref].v), sheet[ref].f ? `[f: ${sheet[ref].f}]` : '');
    }
  }
}
console.log('44956 parsed:', XLSX.SSF.parse_date_code(44956));
