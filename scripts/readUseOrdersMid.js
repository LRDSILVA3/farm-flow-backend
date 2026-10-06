const fs = require('fs');
const lines = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/hooks/useOrders.ts', 'utf8').split('\n');
for (let i = 90; i < 180; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
