const fs = require('fs');
const content = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/hooks/useOrders.ts', 'utf8');
const lines = content.split('\n');
lines.slice(580, 620).forEach((line, idx) => {
  console.log(`${idx + 581}: ${line}`);
});
