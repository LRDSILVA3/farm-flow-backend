const fs = require('fs');
const filePath = 'c:/Users/User/Documents/Projects/farm-flow-frontend/src/hooks/useOrders.ts';
let content = fs.readFileSync(filePath, 'utf8');

const target = `  return {
    orders,
    setOrders,
    loading,`;

const replacement = `  // Lifecycle action: Dar Baixa Direta
  const markOrderAsPaid = async (orderId: string, method = 'PIX') => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const orderTotal = order.numericValue || parseValue(order.value) || 0;
    const remaining = Math.max(0, orderTotal - (order.paidAmount || 0));
    await recordPayment(orderId, { amount: remaining > 0 ? remaining : orderTotal, method, notes: 'Baixa integral via Financeiro' });
  };

  return {
    orders,
    setOrders,
    loading,`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content);
  console.log('useOrders.ts successfully patched with markOrderAsPaid!');
} else {
  console.error('Target string not found in useOrders.ts');
}
