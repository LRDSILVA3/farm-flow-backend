const XLSX = require('../../farm-flow-frontend/node_modules/xlsx');
const path = require('path');
const wb = XLSX.readFile(path.resolve(__dirname, '../../farm-flow-frontend/budget/budget.xlsm'));

for (const sheetName of wb.SheetNames) {
  const sheet = wb.Sheets[sheetName];
  if (!sheet) continue;
  const matches = [];
  for (const k of Object.keys(sheet)) {
    if (k.startsWith('!')) continue;
    const cell = sheet[k];
    if (cell && cell.f && (cell.f.includes('POWER') || cell.f.includes('DAYS') || cell.f.includes('1.0'))) {
      matches.push(`${k}: ${cell.f} (val: ${cell.v})`);
    }
  }
  if (matches.length > 0) {
    console.log(`=== Sheet: ${sheetName} ===`);
    matches.forEach(m => console.log('  ', m));
  }
}
