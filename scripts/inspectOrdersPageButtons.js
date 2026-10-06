const fs = require('fs');
const content = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/OrdersPage.tsx', 'utf8');
console.log(content.substring(0, 1400));
