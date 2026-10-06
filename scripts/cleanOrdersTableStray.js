const fs = require('fs');

const filePath = 'C:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/OrdersTable.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetSnippet = `        </div>
        const activeOrderForExec = selectedOrderForExec
    ? orders.find((o) => o.id === selectedOrderForExec.id) || selectedOrderForExec
    : null;

  const activeOrderForPay = selectedOrderForPay
    ? orders.find((o) => o.id === selectedOrderForPay.id) || selectedOrderForPay
    : null;

  const activeOrderForPrint = selectedOrderForPrint
    ? orders.find((o) => o.id === selectedOrderForPrint.id) || selectedOrderForPrint
    : null;

        {/* Lifecycle Modals */}`;

const cleanSnippet = `        </div>

        {/* Lifecycle Modals */}`;

content = content.replace(targetSnippet, cleanSnippet);
fs.writeFileSync(filePath, content);
console.log('Cleaned stray snippet from OrdersTable.tsx!');
