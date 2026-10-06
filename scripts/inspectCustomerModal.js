const fs = require('fs');
const content = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/customers/CustomerFormModal.tsx', 'utf8');
console.log(content.slice(0, 3000));
