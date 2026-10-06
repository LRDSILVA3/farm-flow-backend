const fs = require('fs');

['useServices.ts', 'useProducts.ts', 'useCostVariables.ts', 'useServiceGroups.ts', 'useEquipment.ts'].forEach(file => {
  const p = `c:/Users/User/Documents/Projects/farm-flow-frontend/src/hooks/${file}`;
  if (fs.existsSync(p)) {
    console.log(`=== ${file} ===`);
    console.log(fs.readFileSync(p, 'utf8').slice(0, 300));
  }
});
