const fs = require('fs');
const conf = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/ConferenciaServiceForm.tsx', 'utf8');
const soil = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/SoilSamplingServiceForm.tsx', 'utf8');

console.log('=== Conferencia useEffects ===');
const confEffs = conf.match(/useEffect\([\s\S]*?\}, \[[\s\S]*?\]\);/g);
confEffs?.forEach(e => console.log(e.substring(0, 200)));

console.log('=== SoilSampling useEffects ===');
const soilEffs = soil.match(/useEffect\([\s\S]*?\}, \[[\s\S]*?\]\);/g);
soilEffs?.forEach(e => console.log(e.substring(0, 200)));
