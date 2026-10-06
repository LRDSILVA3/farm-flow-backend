const fs = require('fs');
const soil = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/SoilSamplingServiceForm.tsx', 'utf8');

const ptInputIdx = soil.indexOf('Pontos de Amostragem');
console.log(soil.substring(ptInputIdx - 100, ptInputIdx + 400));
