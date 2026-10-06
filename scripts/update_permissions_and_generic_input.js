const fs = require('fs');
const path = require('path');

// 1. Atualizar OrderForm.tsx para ocultar inputs genéricos a não ser que 'Serviço' avulso esteja selecionado
const orderFormPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/orders/OrderForm.tsx');
let orderFormContent = fs.readFileSync(orderFormPath, 'utf8');

orderFormContent = orderFormContent.replace(
  '{!activeSpecializedService && formData.type !== "Produto" && (',
  '{formData.type === "Serviço" && ('
);

fs.writeFileSync(orderFormPath, orderFormContent, 'utf8');
console.log('✅ OrderForm.tsx updated: generic inputs only show when "Serviço" is selected!');

// 2. Atualizar UserModal.tsx para incluir reports e controle de permissões
const userModalPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/settings/UserModal.tsx');
let userModalContent = fs.readFileSync(userModalPath, 'utf8');

if (!userModalContent.includes('reports')) {
  userModalContent = userModalContent.replace(
    '{ id: "settings", name: "Configurações" }',
    '{ id: "reports", name: "Relatórios & Auditoria" },\n  { id: "settings", name: "Configurações" }'
  );
  fs.writeFileSync(userModalPath, userModalContent, 'utf8');
  console.log('✅ UserModal.tsx updated with reports permission!');
}
