const fs = require('fs');
const orderForm = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/OrderForm.tsx', 'utf8');

console.log('OrderForm length:', orderForm.length);
// Check for *Sincronizado
const syncIdx = orderForm.indexOf('Sincronizado com');
if (syncIdx !== -1) {
  console.log('Found sync disclaimer at:', orderForm.substring(syncIdx - 50, syncIdx + 120));
}

// Check for alqueires calculation
const alqMatches = orderForm.match(/.{0,50}(alqueire|ha_to_alq|2\.42|alq).{0,50}/gi);
console.log('Alqueires matches:', alqMatches?.slice(0, 5));

// Check state resets
const stateMatches = orderForm.match(/const\s+\[formData[\s\S]*?\}\);/);
console.log('Form data state init:', stateMatches?.[0]?.substring(0, 300));
