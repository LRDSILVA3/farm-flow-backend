const fs = require('fs');
const conf = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/ConferenciaServiceForm.tsx', 'utf8');
const lines = conf.split('\n');
console.log('Total lines in ConferenciaServiceForm:', lines.length);
for (let i = 180; i < 220; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
