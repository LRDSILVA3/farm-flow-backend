const fs = require('fs');
const content = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/customers/CustomersForm.tsx', 'utf8');
console.log(content.slice(3200, 4500));
