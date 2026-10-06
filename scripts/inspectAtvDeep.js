const XLSX = require('../../farm-flow-frontend/node_modules/xlsx');
const path = require('path');
const wb = XLSX.readFile(path.resolve(__dirname, '../../farm-flow-frontend/budget/budget.xlsm'));

console.log('=== INPUT ATV ===');
const atv = wb.Sheets['INPUT ATV'];
for (let r = 1; r <= 35; r++) {
  const row = [];
  for (let c = 0; c < 20; c++) {
    const ref = XLSX.utils.encode_col(c) + r;
    if (atv[ref] && (atv[ref].v !== undefined || atv[ref].f)) {
      row.push(`${ref}: ${JSON.stringify(atv[ref].v)} [${atv[ref].f || ''}]`);
    }
  }
  if (row.length) console.log(`Row ${r}:`, row.join(' ; '));
}

console.log('\n=== PEDIDO ATV ===');
const patv = wb.Sheets['PEDIDO ATV'];
for (let r = 35; r <= 55; r++) {
  const row = [];
  for (let c = 0; c < 15; c++) {
    const ref = XLSX.utils.encode_col(c) + r;
    if (patv[ref] && (patv[ref].v !== undefined || patv[ref].f)) {
      row.push(`${ref}: ${JSON.stringify(patv[ref].v)} [${patv[ref].f || ''}]`);
    }
  }
  if (row.length) console.log(`Row ${r}:`, row.join(' ; '));
}
