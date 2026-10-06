const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/orders');

// 1. Update ConferenciaServiceForm.tsx
const confPath = path.join(baseDir, 'ConferenciaServiceForm.tsx');
let confContent = fs.readFileSync(confPath, 'utf8');

if (!confContent.includes('onProductsChange?:')) {
  confContent = confContent.replace(
    'onAllPlotsSelectedChange: (selected: boolean) => void;',
    'onAllPlotsSelectedChange: (selected: boolean) => void;\n  onProductsChange?: (products: any[]) => void;'
  );
  confContent = confContent.replace(
    'onAllPlotsSelectedChange,',
    'onAllPlotsSelectedChange,\n  onProductsChange,'
  );
  const targetCall = 'onValuesChange(result.totalValue);';
  const replacementCall = `onValuesChange(result.totalValue);
      if (onProductsChange) {
        onProductsChange([
          { id: 'analises_macro', name: 'ANÁLISE DE SOLO (MACRO+S+P_REM)', quantity: numAnalises || 10, unit: 'PTOS', price: 105.30 },
          ...(result.details.numAnalises20_40cm > 0 ? [{ id: 'analises_20_40', name: 'ANÁLISE DE SOLO 20-40 CM (MACRO+S)', quantity: result.details.numAnalises20_40cm, unit: 'PTOS', price: 70 }] : []),
          ...(desejaAnaliseFisica ? [{ id: 'analise_fisica', name: 'ANÁLISE FÍSICA', quantity: 1, unit: 'UNID', price: 42.30 }] : []),
        ]);
      }`;
  confContent = confContent.replace(targetCall, replacementCall);
  fs.writeFileSync(confPath, confContent, 'utf8');
  console.log('ConferenciaServiceForm.tsx updated with onProductsChange.');
}

// 2. Update SoilSamplingServiceForm.tsx
const apPath = path.join(baseDir, 'SoilSamplingServiceForm.tsx');
let apContent = fs.readFileSync(apPath, 'utf8');

if (!apContent.includes('onProductsChange?:')) {
  apContent = apContent.replace(
    'onAreaChange?: (areaHa: number) => void;',
    'onAreaChange?: (areaHa: number) => void;\n  onProductsChange?: (products: any[]) => void;'
  );
  apContent = apContent.replace(
    'onAreaChange,',
    'onAreaChange,\n  onProductsChange,'
  );
  const apTarget = 'onValuesChange(result.totalValue);';
  const apReplacement = `onValuesChange(result.totalValue);
      if (onProductsChange) {
        const points = numPontos || result.details.numMinimoAnalises || 41;
        const haPonto = result.details.haPorPonto ? result.details.haPorPonto.toFixed(2) : '2.95';
        onProductsChange([
          { id: 'analises_inclusas', name: 'ANÁLISE INCLUSA (' + haPonto + ' ha/ponto)', quantity: points, unit: 'PTOS', price: 0 }
        ]);
      }`;
  apContent = apContent.replace(apTarget, apReplacement);
  fs.writeFileSync(apPath, apContent, 'utf8');
  console.log('SoilSamplingServiceForm.tsx updated with onProductsChange.');
}

// 3. Update OrderForm.tsx
const orderFormPath = path.join(baseDir, 'OrderForm.tsx');
let formContent = fs.readFileSync(orderFormPath, 'utf8');

if (!formContent.includes('onProductsChange={(products) => onInputChange("productsData", products)}')) {
  formContent = formContent.replace(
    'onAllPlotsSelectedChange={setIsConferenciaAllPlotsSelected}',
    'onAllPlotsSelectedChange={setIsConferenciaAllPlotsSelected}\n              onProductsChange={(products) => onInputChange("productsData", products)}'
  );
  formContent = formContent.replace(
    'onAreaChange={(areaHa) => onInputChange("area", areaHa.toFixed(2))}',
    'onAreaChange={(areaHa) => onInputChange("area", areaHa.toFixed(2))}\n              onProductsChange={(products) => onInputChange("productsData", products)}'
  );
  fs.writeFileSync(orderFormPath, formContent, 'utf8');
  console.log('OrderForm.tsx updated with onProductsChange handlers.');
}

console.log('All forms synchronized successfully.');
