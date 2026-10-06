const fs = require('fs');
const content = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/OrderForm.tsx', 'utf8');
const lines = content.split('\n');
lines.slice(180, 260).forEach((line, idx) => {
  console.log(`${idx + 181}: ${line}`);
});
