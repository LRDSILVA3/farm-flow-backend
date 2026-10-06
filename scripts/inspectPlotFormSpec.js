const fs = require('fs');

function inspectTest(file) {
  console.log(`=== ${file} ===`);
  const c = fs.readFileSync(file, 'utf8');
  console.log(c);
}

inspectTest('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/farms/PlotForm.spec.tsx');
