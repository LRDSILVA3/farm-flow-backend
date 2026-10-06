const fs = require('fs');
const content = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/ui/sidebar.tsx', 'utf8');
const lines = content.split('\n');
lines.slice(450, 520).forEach((line, idx) => {
  console.log(`${idx + 451}: ${line}`);
});
