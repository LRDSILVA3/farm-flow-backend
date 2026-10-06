const fs = require('fs');
const soil = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/SoilSamplingServiceForm.tsx', 'utf8');
const lines = soil.split('\n');
for (let i = 185; i < 216; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
