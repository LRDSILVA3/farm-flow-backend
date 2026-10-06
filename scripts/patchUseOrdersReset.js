const fs = require('fs');

const path = 'c:/Users/User/Documents/Projects/farm-flow-frontend/src/hooks/useOrders.ts';
let content = fs.readFileSync(path, 'utf8');

// Add resetOrderForm to useOrders hook
const initialFormDataDef = `  const initialOrderFormData: Order = {
    id: "",
    clientId: "",
    farmId: "",
    type: "Amostragem de Solo (AP)",
    serviceName: "Amostragem de Solo (AP)",
    productsData: [],
    serviceGroup: "",
    area: "",
    value: "",
    numericValue: 0,
    status: "Pendente",
    payment: "Aguardando",
    executions: [],
    schedules: [],
    payments: [],
    logs: [],
    executedArea: 0,
    paidAmount: 0
  };`;

if (!content.includes('initialOrderFormData')) {
  content = content.replace(
    '  const [formData, setFormData] = useState<Order>({',
    `${initialFormDataDef}\n  const [formData, setFormData] = useState<Order>(initialOrderFormData);`
  );

  // Remove the old inline object
  content = content.replace(/id: "",[\s\S]*?paidAmount: 0\s*\n\s*\}\);/, '');

  // Add resetOrderForm function
  const resetFn = `  const resetOrderForm = () => {
    setEditingOrder(null);
    setFormData({ ...initialOrderFormData });
  };`;

  content = content.replace(
    '  const fetchOrders = async () => {',
    `${resetFn}\n\n  const fetchOrders = async () => {`
  );

  // Add resetOrderForm to return object
  content = content.replace(
    'refetch: fetchOrders',
    'resetOrderForm,\n    refetch: fetchOrders'
  );

  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully patched useOrders.ts with resetOrderForm!');
} else {
  console.log('useOrders.ts already has initialOrderFormData');
}
