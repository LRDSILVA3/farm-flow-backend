const fs = require('fs');
const lines = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/OrderForm.tsx', 'utf8').split('\n');
console.log('Total lines:', lines.length);
for (let i = 0; i < 120; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
