const XLSX = require('../../farm-flow-frontend/node_modules/xlsx');
const path = require('path');
const wb = XLSX.readFile(path.resolve(__dirname, '../../farm-flow-frontend/budget/budget.xlsm'));

console.log('=== PEDIDO DRONE ===');
const drone = wb.Sheets['PEDIDO DRONE'];
for (let r = 28; r <= 48; r++) {
  const row = [];
  for (let c = 0; c < 15; c++) {
    const ref = XLSX.utils.encode_col(c) + r;
    if (drone[ref]) row.push(`${ref}: ${JSON.stringify(drone[ref].v)} [${drone[ref].f || ''}]`);
  }
  if (row.length) console.log(`Row ${r}:`, row.join(' ; '));
}

console.log('\n=== PEDIDO COMPACTA ===');
const comp = wb.Sheets['PEDIDO COMPACTA'];
for (let r = 28; r <= 48; r++) {
  const row = [];
  for (let c = 0; c < 15; c++) {
    const ref = XLSX.utils.encode_col(c) + r;
    if (comp[ref]) row.push(`${ref}: ${JSON.stringify(comp[ref].v)} [${comp[ref].f || ''}]`);
  }
  if (row.length) console.log(`Row ${r}:`, row.join(' ; '));
}
