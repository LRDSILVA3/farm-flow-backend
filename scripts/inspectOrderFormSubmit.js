const fs = require('fs');
const content = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/OrderForm.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('handleSubmit') || line.includes('Criar Pedido') || line.includes('handleFormSubmit')) {
    console.log(`${idx+1}: ${line}`);
  }
});
