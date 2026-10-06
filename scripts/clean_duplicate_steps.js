const fs = require('fs');
const path = require('path');

const p1 = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/orders/SoilSamplingServiceForm.tsx');
let c1 = fs.readFileSync(p1, 'utf8');
c1 = c1.replace('type="number" step="any"', 'type="number"');
fs.writeFileSync(p1, c1, 'utf8');

const p2 = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/orders/ATVServiceForm.tsx');
let c2 = fs.readFileSync(p2, 'utf8');
c2 = c2.replace('type="number" step="any"', 'type="number"');
fs.writeFileSync(p2, c2, 'utf8');

console.log('✅ Cleaned duplicate step attributes!');
