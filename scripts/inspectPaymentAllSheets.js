const XLSX = require('../../farm-flow-frontend/node_modules/xlsx');
const path = require('path');
const wb = XLSX.readFile(path.resolve(__dirname, '../../farm-flow-frontend/budget/budget.xlsm'));

const keywords = ['pagamento', 'vencimento', 'prazo', 'juro', 'vista', 'fator', 'forma', 'desconto', 'condi'];

for (const sheetName of wb.SheetNames) {
  const sheet = wb.Sheets[sheetName];
  if (!sheet) continue;
  const matches = [];
  for (const k of Object.keys(sheet)) {
    if (k.startsWith('!')) continue;
    const cell = sheet[k];
    if (cell && (cell.v || cell.f)) {
      const valStr = String(cell.v || '').toLowerCase();
      const formStr = String(cell.f || '').toLowerCase();
      if (keywords.some(kw => valStr.includes(kw) || formStr.includes(kw))) {
        matches.push(`${k}: val="${cell.v}" | formula=${cell.f || 'none'}`);
      }
    }
  }
  if (matches.length > 0) {
    console.log(`=== Sheet: ${sheetName} ===`);
    matches.forEach(m => console.log('  ', m));
  }
}
