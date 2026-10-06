const fs = require('fs');
const content = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/hooks/useServices.ts', 'utf8');
console.log(content.slice(0, 1000));
