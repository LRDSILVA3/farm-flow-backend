const fs = require('fs');
const soil = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/SoilSamplingServiceForm.tsx', 'utf8');
const lines = soil.split('\n');
console.log('Total lines in SoilSamplingServiceForm:', lines.length);
for (let i = 0; i < 70; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
