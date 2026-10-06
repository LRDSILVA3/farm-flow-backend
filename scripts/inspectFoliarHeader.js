const XLSX = require('../../farm-flow-frontend/node_modules/xlsx');
const path = require('path');

const filePath = path.resolve(__dirname, '../../farm-flow-frontend/budget/budget.xlsm');
const workbook = XLSX.readFile(filePath, { cellFormula: true, cellNF: true, cellDates: false });

const sheet = workbook.Sheets['INPUT FOLHA '];

for (let r = 1; r <= 10; r++) {
  const row = [];
  for (let c = 0; c < 15; c++) {
    const colLetter = XLSX.utils.encode_col(c);
    const cellRef = `${colLetter}${r}`;
    const cell = sheet[cellRef];
    if (cell) {
      row.push(`${cellRef}: val=${JSON.stringify(cell.v)} | f=${cell.f || 'none'}`);
    }
  }
  console.log(`Row ${r}:`, row.join(' ; '));
}
