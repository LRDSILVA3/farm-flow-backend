const fs = require('fs');
const farmForm = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/farms/FarmForm.tsx', 'utf8');
const plotForm = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/farms/PlotForm.tsx', 'utf8');
console.log('=== FARM FORM ===');
console.log(farmForm.substring(0, 1500));
console.log('=== PLOT FORM ===');
console.log(plotForm.substring(0, 1500));
