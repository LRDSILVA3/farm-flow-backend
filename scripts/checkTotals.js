const XLSX = require('../../farm-flow-frontend/node_modules/xlsx');
const path = require('path');
const wb = XLSX.readFile(path.resolve(__dirname, '../../farm-flow-frontend/budget/budget.xlsm'));
const sheet = wb.Sheets['INPUT FOLHA '];
console.log('B27 formula:', sheet['B27'] ? sheet['B27'].f : null, 'val:', sheet['B27'] ? sheet['B27'].v : null);
console.log('C27 formula:', sheet['C27'] ? sheet['C27'].f : null, 'val:', sheet['C27'] ? sheet['C27'].v : null);
console.log('E28 formula:', sheet['E28'] ? sheet['E28'].f : null, 'val:', sheet['E28'] ? sheet['E28'].v : null);
console.log('E29 formula:', sheet['E29'] ? sheet['E29'].f : null, 'val:', sheet['E29'] ? sheet['E29'].v : null);
console.log('E30 formula:', sheet['E30'] ? sheet['E30'].f : null, 'val:', sheet['E30'] ? sheet['E30'].v : null);
