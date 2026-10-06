const XLSX = require('../../farm-flow-frontend/node_modules/xlsx');
const path = require('path');
const wb = XLSX.readFile(path.resolve(__dirname, '../../farm-flow-frontend/budget/budget.xlsm'));

console.log('====================================');
console.log('1. DRONE MAPEAMENTO (PEDIDO DRONE)');
console.log('====================================');
const drone = wb.Sheets['PEDIDO DRONE'];
for (let r = 30; r <= 38; r++) {
  const row = [];
  for (let c = 0; c < 15; c++) {
    const ref = XLSX.utils.encode_col(c) + r;
    if (drone[ref]) row.push(`${ref}: ${JSON.stringify(drone[ref].v)} [${drone[ref].f || ''}]`);
  }
  if (row.length) console.log(`Row ${r}:`, row.join(' ; '));
}

console.log('\n====================================');
console.log('2. COMPACTAÇÃO (PEDIDO COMPACTA)');
console.log('====================================');
const comp = wb.Sheets['PEDIDO COMPACTA'];
for (let r = 30; r <= 45; r++) {
  const row = [];
  for (let c = 0; c < 15; c++) {
    const ref = XLSX.utils.encode_col(c) + r;
    if (comp[ref]) row.push(`${ref}: ${JSON.stringify(comp[ref].v)} [${comp[ref].f || ''}]`);
  }
  if (row.length) console.log(`Row ${r}:`, row.join(' ; '));
}

console.log('\n====================================');
console.log('3. CONFERÊNCIA (INPUT CONFERENCIA)');
console.log('====================================');
const conf = wb.Sheets['INPUT CONFERENCIA'];
for (let r = 1; r <= 10; r++) {
  const row = [];
  for (let c = 0; c < 10; c++) {
    const ref = XLSX.utils.encode_col(c) + r;
    if (conf[ref]) row.push(`${ref}: ${JSON.stringify(conf[ref].v)} [${conf[ref].f || ''}]`);
  }
  if (row.length) console.log(`Row ${r}:`, row.join(' ; '));
}

console.log('\n====================================');
console.log('4. AMOSTRAGEM DE SOLO (INPUT DADOS)');
console.log('====================================');
const dados = wb.Sheets['INPUT DADOS'];
for (let r = 1; r <= 15; r++) {
  const row = [];
  for (let c = 0; c < 10; c++) {
    const ref = XLSX.utils.encode_col(c) + r;
    if (dados[ref]) row.push(`${ref}: ${JSON.stringify(dados[ref].v)} [${dados[ref].f || ''}]`);
  }
  if (row.length) console.log(`Row ${r}:`, row.join(' ; '));
}

console.log('\n====================================');
console.log('5. ATV (INPUT ATV)');
console.log('====================================');
const atv = wb.Sheets['INPUT ATV'];
for (let r = 1; r <= 10; r++) {
  const row = [];
  for (let c = 0; c < 10; c++) {
    const ref = XLSX.utils.encode_col(c) + r;
    if (atv[ref]) row.push(`${ref}: ${JSON.stringify(atv[ref].v)} [${atv[ref].f || ''}]`);
  }
  if (row.length) console.log(`Row ${r}:`, row.join(' ; '));
}

console.log('\n====================================');
console.log('6. PULVERIZAÇÃO COM DRONE (INPUT PULVE_DRONE)');
console.log('====================================');
const pulv = wb.Sheets['INPUT PULVE_DRONE'];
for (let r = 1; r <= 32; r++) {
  const row = [];
  for (let c = 0; c < 10; c++) {
    const ref = XLSX.utils.encode_col(c) + r;
    if (pulv[ref]) row.push(`${ref}: ${JSON.stringify(pulv[ref].v)} [${pulv[ref].f || ''}]`);
  }
  if (row.length) console.log(`Row ${r}:`, row.join(' ; '));
}
