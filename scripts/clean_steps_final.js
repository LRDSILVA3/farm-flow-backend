const fs = require('fs');
const path = require('path');

// 1. SoilSamplingServiceForm.tsx
const p1 = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/orders/SoilSamplingServiceForm.tsx');
let c1 = fs.readFileSync(p1, 'utf8');
c1 = c1.replace(
  `id="ap-desconto"
                type="number" step="any"`,
  `id="ap-desconto"
                type="number"`
);
fs.writeFileSync(p1, c1, 'utf8');

// 2. ATVServiceForm.tsx
const p2 = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/orders/ATVServiceForm.tsx');
let c2 = fs.readFileSync(p2, 'utf8');
c2 = c2.replace(
  `<Input
                    type="number" step="any"
                    value={item.areaHa}
                    onChange={(e) => handleItemChange(idx, 'areaHa', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.1"`,
  `<Input
                    type="number"
                    value={item.areaHa}
                    onChange={(e) => handleItemChange(idx, 'areaHa', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.1"`
);
fs.writeFileSync(p2, c2, 'utf8');

console.log('✅ Cleaned duplicate step attributes completely!');
