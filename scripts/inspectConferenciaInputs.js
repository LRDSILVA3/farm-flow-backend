const fs = require('fs');
const content = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/ConferenciaServiceForm.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('required') || line.includes('<input') || line.includes('<Input')) {
    console.log(`${idx+1}: ${line}`);
  }
});
