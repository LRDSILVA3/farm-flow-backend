const fs = require('fs');
const useOrders = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/hooks/useOrders.ts', 'utf8');

const fdIdx = useOrders.indexOf('formData');
console.log('formData occurrences:');
const matches = useOrders.match(/.{0,50}formData.{0,50}/g);
console.log(matches?.slice(0, 10));
