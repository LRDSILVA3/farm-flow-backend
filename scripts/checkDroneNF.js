const XLSX = require('../../farm-flow-frontend/node_modules/xlsx');
const path = require('path');
const wb = XLSX.readFile(path.resolve(__dirname, '../../farm-flow-frontend/budget/budget.xlsm'));
const sheet = wb.Sheets['PEDIDO DRONE'];
let found = 0;
for (const k of Object.keys(sheet)) {
  if (k.startsWith('!')) continue;
  const v = String(sheet[k].v || '');
  if (v.toLowerCase().includes('nota') || v.toLowerCase().includes('fiscal') || v.toLowerCase().includes('nf')) {
    console.log(k, v);
    found++;
  }
}
console.log('PEDIDO DRONE NF matches:', found);
