const fs = require('fs');
const farmForm = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/farms/FarmForm.tsx', 'utf8');
const plotForm = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/farms/PlotForm.tsx', 'utf8');
console.log('=== FARM FORM FIELDS ===');
const farmMatches = farmForm.match(/<Label[^>]*>.*?<\/Label>[\s\S]*?<Input[^>]*>/g);
console.log(farmMatches?.slice(0, 10));
console.log('=== PLOT FORM FIELDS ===');
const plotMatches = plotForm.match(/<Label[^>]*>.*?<\/Label>[\s\S]*?<Input[^>]*>/g);
console.log(plotMatches);
