const XLSX = require('../../farm-flow-frontend/node_modules/xlsx');
const path = require('path');
const wb = XLSX.readFile(path.resolve(__dirname, '../../farm-flow-frontend/budget/budget.xlsm'));

const terms = ['boleto', 'cheque', 'carteira', 'vista', 'prazo', 'pix', 'dinheiro', 'cartao'];

for (const s of wb.SheetNames) {
  const sheet = wb.Sheets[s];
  for (const k of Object.keys(sheet)) {
    if (k.startsWith('!')) continue;
    const c = sheet[k];
    if (!c) continue;
    const v = String(c.v || '').toLowerCase();
    const f = String(c.f || '').toLowerCase();
    if (terms.some(t => v.includes(t) || f.includes(t))) {
      console.log(`${s} [${k}]: val="${c.v}" | f="${c.f || ''}"`);
    }
  }
}
