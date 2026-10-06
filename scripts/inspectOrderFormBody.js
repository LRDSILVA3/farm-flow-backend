const fs = require('fs');
const lines = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/OrderForm.tsx', 'utf8').split('\n');
for (let i = 120; i < 260; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
