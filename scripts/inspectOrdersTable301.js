const fs = require('fs');
const content = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/OrdersTable.tsx', 'utf8');
const lines = content.split('\n');
lines.slice(300, 360).forEach((line, idx) => {
  console.log(`${idx + 301}: ${line}`);
});
