const fs = require('fs');
const content = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/ui/sidebar.tsx', 'utf8');
const lines = content.split('\n');
lines.slice(314, 335).forEach((line, idx) => {
  console.log(`${idx + 315}: ${line}`);
});
