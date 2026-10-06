const XLSX = require('../../farm-flow-frontend/node_modules/xlsx');
const path = require('path');
const wb = XLSX.readFile(path.resolve(__dirname, '../../farm-flow-frontend/budget/budget.xlsm'));
const db = wb.Sheets['BANCO DE DADOS'];
const atv = wb.Sheets['INPUT ATV'];

// Let's inspect formulas for Q17, Q19, Q20, Q21, Q22 in INPUT ATV:
console.log('Q17 (subtotal):', atv['Q17']?.f, 'val:', atv['Q17']?.v);
console.log('Q19 (desc NF):', atv['Q19']?.f, 'val:', atv['Q19']?.v);
console.log('Q20 (desloc):', atv['Q20']?.f, 'val:', atv['Q20']?.v);
console.log('Q21 (carregamento):', atv['Q21']?.f, 'val:', atv['Q21']?.v);
console.log('Q22 (total):', atv['Q22']?.f, 'val:', atv['Q22']?.v);

// Also let's inspect row 10 (Item 1):
for (let c = 0; c < 18; c++) {
  const ref = XLSX.utils.encode_col(c) + '10';
  if (atv[ref]) console.log(ref + ':', atv[ref].v, atv[ref].f ? `[f: ${atv[ref].f}]` : '');
}
