const XLSX = require('../../farm-flow-frontend/node_modules/xlsx');
const path = require('path');
const wb = XLSX.readFile(path.resolve(__dirname, '../../farm-flow-frontend/budget/budget.xlsm'));

console.log('Searching for references to B11...');
let found = 0;
for (const s of wb.SheetNames) {
  const sheet = wb.Sheets[s];
  for (const k of Object.keys(sheet)) {
    if (k.startsWith('!')) continue;
    const c = sheet[k];
    if (c && c.f && (c.f.includes('B11') || c.f.includes('$B$11'))) {
      console.log(`${s} [${k}]: ${c.f}`);
      found++;
    }
  }
}
console.log('Total found:', found);
