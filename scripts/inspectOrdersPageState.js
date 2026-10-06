const fs = require('fs');
const ordersPage = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/OrdersPage.tsx', 'utf8');
console.log(ordersPage.substring(0, 1500));
