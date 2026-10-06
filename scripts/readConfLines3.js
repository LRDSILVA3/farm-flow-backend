const fs = require('fs');
const conf = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/ConferenciaServiceForm.tsx', 'utf8');
const lines = conf.split('\n');
for (let i = 100; i < 140; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
