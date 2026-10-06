const fs = require('fs');

['useProducts.ts', 'useCostVariables.ts', 'useServiceGroups.ts'].forEach(f => {
  const p = `c:/Users/User/Documents/Projects/farm-flow-frontend/src/hooks/${f}`;
  console.log(`\n================== ${f} ==================`);
  console.log(fs.readFileSync(p, 'utf8'));
});
