const fs = require('fs');
const path = require('path');

const tabPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/financial/FinancialTransactionsTab.tsx');
let content = fs.readFileSync(tabPath, 'utf8');

content = content.replace(
  'saveTransactions([newTx, ...transactions]);',
  `saveTransactions([newTx, ...transactions]);

    // Envia para o backend PostgreSQL
    api.post('/financial/transactions', {
      description: newTx.description,
      type: newTx.type,
      category: newTx.category,
      amount: newTx.amount,
      due_date: newTx.dueDate,
      payment_date: newTx.paidDate || null,
      status: newTx.status,
      payment_method: newTx.paymentMethod,
      notes: newTx.clientOrSupplier || newTx.notes
    }).catch(err => console.warn('Erro ao salvar transação no backend:', err));`
);

fs.writeFileSync(tabPath, content, 'utf8');
console.log('✅ handleSaveTransaction updated to post to /financial/transactions!');
