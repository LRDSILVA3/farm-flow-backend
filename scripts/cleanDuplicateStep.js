const fs = require('fs');

function cleanDuplicateStep(file) {
  let c = fs.readFileSync(file, 'utf8');
  // Replace type="number" step="any" ... step="0.1"
  c = c.replace(/type="number"\s+step="any"([\s\S]*?)step="([0-9.]+)"/g, 'type="number"$1step="$2"');
  fs.writeFileSync(file, c, 'utf8');
  console.log('Cleaned duplicate step in', file);
}

cleanDuplicateStep('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/ATVServiceForm.tsx');
cleanDuplicateStep('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/SoilSamplingServiceForm.tsx');
