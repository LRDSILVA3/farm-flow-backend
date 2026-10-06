const fs = require('fs');
const path = require('path');

const frontendPath = path.resolve(__dirname, '../../farm-flow-frontend');

// 1. Patch SoilSamplingServiceForm.tsx to add onAreaChange prop
const sFormPath = path.join(frontendPath, 'src/components/pages/orders/SoilSamplingServiceForm.tsx');
let sForm = fs.readFileSync(sFormPath, 'utf8');

sForm = sForm.replace(
  'interface SoilSamplingServiceFormProps {\n  initialAlqueires: number;\n  initialNumPontos: number;\n  onValuesChange: (calculatedValue: number) => void;\n}',
  'interface SoilSamplingServiceFormProps {\n  initialAlqueires: number;\n  initialNumPontos: number;\n  onValuesChange: (calculatedValue: number) => void;\n  onAreaChange?: (areaHa: number) => void;\n}'
);

sForm = sForm.replace(
  'export const SoilSamplingServiceForm: React.FC<SoilSamplingServiceFormProps> = ({\n  initialAlqueires,\n  initialNumPontos,\n  onValuesChange,\n}) => {',
  'export const SoilSamplingServiceForm: React.FC<SoilSamplingServiceFormProps> = ({\n  initialAlqueires,\n  initialNumPontos,\n  onValuesChange,\n  onAreaChange,\n}) => {'
);

sForm = sForm.replace(
  '      setCalculationResult(result);\n      onValuesChange(result.totalValue);',
  '      setCalculationResult(result);\n      onValuesChange(result.totalValue);\n      if (onAreaChange && result.details.hectares > 0) {\n        onAreaChange(result.details.hectares);\n      }'
);

fs.writeFileSync(sFormPath, sForm, 'utf8');
console.log('Patched SoilSamplingServiceForm.tsx with onAreaChange');

// 2. Patch OrderForm.tsx
const orderFormPath = path.join(frontendPath, 'src/components/pages/orders/OrderForm.tsx');
let oForm = fs.readFileSync(orderFormPath, 'utf8');

// Ensure type select updates serviceName
oForm = oForm.replace(
  '<Select value={formData.type} onValueChange={(value) => onInputChange("type", value)}>',
  `<Select
              value={formData.type}
              onValueChange={(value) => {
                onInputChange("type", value);
                if (value !== "Produto" && value !== "Serviço" && value !== "Grupo de Serviços") {
                  onInputChange("serviceName", value);
                }
              }}
            >`
);

// Pass onAreaChange in SoilSamplingServiceForm
oForm = oForm.replace(
  `          {activeSpecializedService === "Amostragem de Solo (AP)" && (
            <SoilSamplingServiceForm
              initialAlqueires={((parseFloat(formData.area) || 0) / 2.42)}
              initialNumPontos={parseInt(formData.productsData?.[0]?.quantity?.toString() || "0")}
              onValuesChange={(calculatedValue) => onInputChange("value", calculatedValue.toFixed(2))}
            />
          )}`,
  `          {activeSpecializedService === "Amostragem de Solo (AP)" && (
            <SoilSamplingServiceForm
              initialAlqueires={((parseFloat(formData.area) || 0) / 2.42)}
              initialNumPontos={parseInt(formData.productsData?.[0]?.quantity?.toString() || "0")}
              onValuesChange={(calculatedValue) => onInputChange("value", calculatedValue.toFixed(2))}
              onAreaChange={(areaHa) => onInputChange("area", areaHa.toFixed(2))}
            />
          )}`
);

fs.writeFileSync(orderFormPath, oForm, 'utf8');
console.log('Patched OrderForm.tsx');
