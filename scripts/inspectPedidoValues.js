const XLSX = require('../../farm-flow-frontend/node_modules/xlsx');
const path = require('path');
const wb = XLSX.readFile(path.resolve(__dirname, '../../farm-flow-frontend/budget/budget.xlsm'));

['PEDIDO CONFERENCIA', 'PEDIDO VIA CLIENTE'].forEach(s => {
  const ws = wb.Sheets[s];
  console.log('=== ' + s + ' ===');
  for (let r = 38; r <= 50; r++) {
    const q = ws['B' + r]?.v;
    const u = ws['D' + r]?.v;
    const d = ws['E' + r]?.v;
    const pu = ws['I' + r]?.v;
    const tot = ws['J' + r]?.v;
    const puf = ws['I' + r]?.f;
    const totf = ws['J' + r]?.f;
    if (q !== undefined || d !== undefined || tot !== undefined) {
      console.log(`Row ${r}: Qty=${q || ''} | Unit=${u || ''} | Desc=${d || ''} | R$/Unid=${pu !== undefined ? pu : ''} (f: ${puf || 'none'}) | Total=${tot !== undefined ? tot : ''} (f: ${totf || 'none'})`);
    }
  }
});
