const XLSX = require('../../farm-flow-frontend/node_modules/xlsx');
const path = require('path');

const filePath = path.resolve(__dirname, '../../farm-flow-frontend/budget/budget.xlsm');
const workbook = XLSX.readFile(filePath, { cellFormula: true, cellNF: true, cellDates: true });

console.log('Sheets:', workbook.SheetNames);
