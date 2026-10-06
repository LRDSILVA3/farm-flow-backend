const fs = require('fs');
const path = require('path');

// 1. Update useOrders.ts
const useOrdersPath = path.resolve(__dirname, '../../farm-flow-frontend/src/hooks/useOrders.ts');
let ordersContent = fs.readFileSync(useOrdersPath, 'utf8');

const enhancedSanitizer = `const sanitizeText = (str: string | null | undefined): string => {
  if (!str) return '';
  let s = String(str);
  s = s.replace(/\\uFFFD/g, 'ê');
  s = s.replace(/Confer[?\\uFFFD]?ncia/gi, 'Conferência');
  s = s.replace(/ConferÃªncia/gi, 'Conferência');
  s = s.replace(/Conferncia/gi, 'Conferência');
  s = s.replace(/Compacta[?\\uFFFD]?o|CompactaÃ§Ã£o|Compactao/gi, 'Compactação');
  s = s.replace(/Aplica[?\\uFFFD]?o|AplicaÃ§Ã£o|Aplicao/gi, 'Aplicação');
  s = s.replace(/Pulveriza[?\\uFFFD]?o|PulverizaÃ§Ã£o|Pulverizao/gi, 'Pulverização');
  s = s.replace(/Equaliza[?\\uFFFD]?o|EqualizaÃ§Ã£o|Equalizao/gi, 'Equalização');
  return s;
};
`;

// Replace existing sanitizeText
ordersContent = ordersContent.replace(/const sanitizeText = \(str: string \| null \| undefined\): string => {[\s\S]*?};\n?/, enhancedSanitizer);
fs.writeFileSync(useOrdersPath, ordersContent, 'utf8');
console.log('useOrders.ts updated successfully.');

// 2. Update OrdersTable.tsx
const tablePath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/orders/OrdersTable.tsx');
let tableContent = fs.readFileSync(tablePath, 'utf8');

const tableSanitizer = `const formatServiceName = (name: string | null | undefined): string => {
  if (!name) return 'Serviço';
  let s = String(name);
  s = s.replace(/\\uFFFD/g, 'ê');
  s = s.replace(/Confer[?\\uFFFD]?ncia/gi, 'Conferência');
  s = s.replace(/ConferÃªncia/gi, 'Conferência');
  s = s.replace(/Conferncia/gi, 'Conferência');
  s = s.replace(/Compacta[?\\uFFFD]?o|CompactaÃ§Ã£o|Compactao/gi, 'Compactação');
  s = s.replace(/Aplica[?\\uFFFD]?o|AplicaÃ§Ã£o|Aplicao/gi, 'Aplicação');
  s = s.replace(/Pulveriza[?\\uFFFD]?o|PulverizaÃ§Ã£o|Pulverizao/gi, 'Pulverização');
  s = s.replace(/Equaliza[?\\uFFFD]?o|EqualizaÃ§Ã£o|Equalizao/gi, 'Equalização');
  return s;
};
`;

if (!tableContent.includes('const formatServiceName =')) {
  tableContent = tableSanitizer + tableContent;
  tableContent = tableContent.replace(
    '{order.serviceName || order.type}',
    '{formatServiceName(order.serviceName || order.type)}'
  );
  fs.writeFileSync(tablePath, tableContent, 'utf8');
  console.log('OrdersTable.tsx updated successfully.');
} else {
  console.log('OrdersTable.tsx already has formatServiceName.');
}
