const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/OrdersTable.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Remove the wrongly placed block
const badBlockRegex = /\s*\/\/ Resolução dinâmica do pedido sempre atualizado para os modais[\s\S]*?: null;\s*/;
content = content.replace(badBlockRegex, '\n        ');

// Place activeOrders right before `return (`
const activeOrdersDeclarations = `
  // Resolução dinâmica do pedido sempre atualizado para os modais
  const activeOrderForSched = selectedOrderForSched
    ? orders.find((o) => o.id === selectedOrderForSched.id) || selectedOrderForSched
    : null;

  const activeOrderForExec = selectedOrderForExec
    ? orders.find((o) => o.id === selectedOrderForExec.id) || selectedOrderForExec
    : null;

  const activeOrderForPay = selectedOrderForPay
    ? orders.find((o) => o.id === selectedOrderForPay.id) || selectedOrderForPay
    : null;

  const activeOrderForPrint = selectedOrderForPrint
    ? orders.find((o) => o.id === selectedOrderForPrint.id) || selectedOrderForPrint
    : null;
`;

content = content.replace('  return (\n    <TooltipProvider>', activeOrdersDeclarations + '\n  return (\n    <TooltipProvider>');

fs.writeFileSync(filePath, content);
console.log('Fixed OrdersTable.tsx activeOrder placement!');
