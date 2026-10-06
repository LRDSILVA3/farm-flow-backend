const fs = require('fs');
const soil = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/SoilSamplingServiceForm.tsx', 'utf8');
const idx = soil.indexOf('budget.xlsm');
if (idx !== -1) {
  console.log('Sample snippet:');
  console.log(soil.substring(idx - 100, idx + 150));
}
