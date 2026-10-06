const fs = require('fs');

console.log('--- App.tsx ---');
console.log(fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/App.tsx', 'utf8'));

console.log('\n--- Index.tsx ---');
console.log(fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/pages/Index.tsx', 'utf8'));
