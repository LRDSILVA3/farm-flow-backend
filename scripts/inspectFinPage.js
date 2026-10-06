const fs = require('fs');
const fin = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/FinancialPage.tsx', 'utf8');
console.log('FinancialPage length:', fin.length);
console.log(fin.substring(0, 1500));
