const fs = require('fs');
const orderForm = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/OrderForm.tsx', 'utf8');

// Find all useEffect in OrderForm
const useEffects = orderForm.match(/useEffect\([\s\S]*?\}, \[[\s\S]*?\]\);/g);
console.log(`Found ${useEffects?.length || 0} useEffects:`);
useEffects?.forEach((eff, i) => {
  console.log(`\n--- useEffect #${i + 1} ---`);
  console.log(eff.substring(0, 300));
});
