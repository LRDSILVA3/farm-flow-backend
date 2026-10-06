const fs = require('fs');
const content = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/OrdersPage.tsx', 'utf8');
const btnIdx = content.indexOf('Novo Pedido');
console.log(content.substring(btnIdx - 100, btnIdx + 200));
const formTagIdx = content.indexOf('<OrderForm');
console.log(content.substring(formTagIdx - 50, formTagIdx + 300));
