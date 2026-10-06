const fs = require('fs');
const orderForm = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/OrderForm.tsx', 'utf8');
const lines = orderForm.split('\n');
console.log('Total lines in OrderForm:', lines.length);
for (let i = 380; i < lines.length; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
