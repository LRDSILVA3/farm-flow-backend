const fs = require('fs');

const path = 'c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/OrdersPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// Destructure resetOrderForm
content = content.replace(
  'itemsPerPage,\n    setItemsPerPage',
  'itemsPerPage,\n    setItemsPerPage,\n    resetOrderForm'
);

// Update Novo Pedido button onClick
content = content.replace(
  'onClick={() => setShowOrderForm(true)}',
  'onClick={() => { resetOrderForm(); setShowOrderForm(true); }}'
);

// Update onCancel in OrderForm
content = content.replace(
  'onCancel={resetForm}',
  'onCancel={() => { resetOrderForm(); setShowOrderForm(false); }}'
);

// Update onOpenChange in OrderForm
content = content.replace(
  'onOpenChange={setShowOrderForm}',
  'onOpenChange={(open) => { if (!open) resetOrderForm(); setShowOrderForm(open); }}'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully patched OrdersPage.tsx with resetOrderForm on open and close!');
