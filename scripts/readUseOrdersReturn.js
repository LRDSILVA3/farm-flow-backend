const fs = require('fs');
const content = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/hooks/useOrders.ts', 'utf8');
const retIdx = content.lastIndexOf('return {');
console.log(content.substring(retIdx, retIdx + 600));
