const fs = require('fs');
const soil = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/SoilSamplingServiceForm.tsx', 'utf8');

const ptMatches = soil.match(/.{0,50}(ponto|pontos|amostragem|ha_por_ponto).{0,50}/gi);
console.log('Points matches in SoilSampling:');
console.log(ptMatches?.slice(0, 10));
