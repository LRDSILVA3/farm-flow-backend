const fs = require('fs');
const content = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/ui/sidebar.tsx', 'utf8');
const lines = content.split('\n');
lines.slice(0, 100).forEach((line, idx) => {
  console.log(`${idx + 1}: ${line}`);
});
