const fs = require('fs');
const pay = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/OrderPaymentDialog.tsx', 'utf8');
console.log('OrderPaymentDialog:', pay.substring(0, 1500));
