const fs = require('fs');
const cost = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/settings/CostVariablesTab.tsx', 'utf8');
console.log('CostVariablesTab:', cost.substring(0, 1500));
