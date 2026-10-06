const XLSX = require('../../farm-flow-frontend/node_modules/xlsx');
const path = require('path');
const wb = XLSX.readFile(path.resolve(__dirname, '../../farm-flow-frontend/budget/budget.xlsm'));
const sheet = wb.Sheets['INPUT CONFERENCIA'];
console.log('B29 formula:', sheet['B29'] ? sheet['B29'].f : null, 'val:', sheet['B29'] ? sheet['B29'].v : null);
console.log('C29 formula:', sheet['C29'] ? sheet['C29'].f : null, 'val:', sheet['C29'] ? sheet['C29'].v : null);
console.log('E4 formula:', sheet['E4'] ? sheet['E4'].f : null, 'val:', sheet['E4'] ? sheet['E4'].v : null);
