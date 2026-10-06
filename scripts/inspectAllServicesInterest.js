const XLSX = require('../../farm-flow-frontend/node_modules/xlsx');
const path = require('path');
const wb = XLSX.readFile(path.resolve(__dirname, '../../farm-flow-frontend/budget/budget.xlsm'));

console.log('--- DB Variables ---');
const db = wb.Sheets['BANCO DE DADOS'];
console.log('B27 (Data base juro):', db['B27'] ? db['B27'].v : null);
console.log('B40 (Juros pgto prazo %):', db['B40'] ? db['B40'].v : null);
console.log('B37 (Prazo maximo):', db['B37'] ? db['B37'].v : null);

console.log('\n--- 1. INPUT DADOS (Amostragem de Solo) ---');
const dados = wb.Sheets['INPUT DADOS'];
console.log('A10..D10:', dados['A10']?.v, '| B10:', dados['B10']?.v, '| C10:', dados['C10']?.v, '| D10 formula:', dados['D10']?.f, '| D10 val:', dados['D10']?.v);
console.log('C8 (Vencimento):', dados['C8']?.v, '| B12 formula:', dados['B12']?.f);

console.log('\n--- 2. INPUT CONFERENCIA ---');
const conf = wb.Sheets['INPUT CONFERENCIA'];
console.log('E5 (Vencimento):', conf['E5']?.v, '| G4 (Data limite):', conf['G4']?.v, conf['G4']?.f);
console.log('F5 (Juro formula):', conf['F5']?.f, '| F5 val:', conf['F5']?.v);

console.log('\n--- 3. PEDIDO DRONE ---');
const drone = wb.Sheets['PEDIDO DRONE'];
console.log('M31, M32, M33, M34:');
console.log('  M31:', drone['M31']?.v, drone['M31']?.f);
console.log('  M32:', drone['M32']?.v, drone['M32']?.f);
console.log('  M33:', drone['M33']?.v, drone['M33']?.f);
console.log('  M34:', drone['M34']?.v, drone['M34']?.f);

console.log('\n--- 4. PEDIDO COMPACTA ---');
const comp = wb.Sheets['PEDIDO COMPACTA'];
console.log('D32 (vencimento?):', comp['D32']?.v, comp['D32']?.f);
console.log('M40 (data base?):', comp['M40']?.v, comp['M40']?.f);
console.log('L42 (juro formula):', comp['L42']?.f, comp['L42']?.v);

console.log('\n--- 5. INPUT ATV ---');
const atv = wb.Sheets['INPUT ATV'];
console.log('F2 (Vencimento):', atv['F2']?.v, atv['F2']?.f);
console.log('F3 (Data base):', atv['F3']?.v, atv['F3']?.f);
console.log('G2 (Juro formula):', atv['G2']?.f, atv['G2']?.v);

console.log('\n--- 6. INPUT PULVE_DRONE ---');
const pulv = wb.Sheets['INPUT PULVE_DRONE'];
console.log('B14 (Vencimento):', pulv['B14']?.v, pulv['B14']?.f);
console.log('B26 (Juro formula):', pulv['B26']?.f, pulv['B26']?.v);

console.log('\n--- 7. EQUALIZA ---');
const eq = wb.Sheets['EQUALIZA'];
for (let r = 30; r <= 46; r++) {
  const row = [];
  for (let c = 0; c < 15; c++) {
    const ref = XLSX.utils.encode_col(c) + r;
    if (eq[ref]) row.push(`${ref}: ${JSON.stringify(eq[ref].v)} [${eq[ref].f || ''}]`);
  }
  if (row.length) console.log(`Row ${r}:`, row.join(' ; '));
}

console.log('\n--- 8. PEDIDO LALLEMAND ---');
const lall = wb.Sheets['PEDIDO LALLEMAND'];
console.log('D29 (Vencimento):', lall['D29']?.v, lall['D29']?.f);
console.log('N31 (Data base):', lall['N31']?.v, lall['N31']?.f);
console.log('N32 (Data vencimento):', lall['N32']?.v, lall['N32']?.f);
console.log('N33 (Taxa):', lall['N33']?.v, lall['N33']?.f);
console.log('N34 (Juros):', lall['N34']?.v, lall['N34']?.f);
