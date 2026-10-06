const fs = require('fs');
const content = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/OrderForm.tsx', 'utf8');
const lines = content.split('\n');
lines.slice(160, 230).forEach((line, idx) => {
  console.log(`${idx + 161}: ${line}`);
});
