const XLSX = require('../../farm-flow-frontend/node_modules/xlsx');
const path = require('path');

const filePath = path.resolve(__dirname, '../../farm-flow-frontend/budget/budget.xlsm');
const workbook = XLSX.readFile(filePath, { cellFormula: true, cellNF: true, cellDates: false });

const sheet = workbook.Sheets['INPUT FOLHA '];
console.log('Range:', sheet['!ref']);

// Inspect cells from A1 to H30
const rows = [];
for (let r = 1; r <= 35; r++) {
  const row = [];
  for (let c = 0; c < 15; c++) {
    const colLetter = XLSX.utils.encode_col(c);
    const cellRef = `${colLetter}${r}`;
    const cell = sheet[cellRef];
    if (cell) {
      row.push(`${cellRef}: val=${JSON.stringify(cell.v)} | f=${cell.f || 'none'}`);
    }
  }
  if (row.length > 0) {
    console.log(`Row ${r}:`, row.join(' ; '));
  }
}
