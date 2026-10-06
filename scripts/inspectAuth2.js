const fs = require('fs');
const content = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/pages/Auth.tsx', 'utf8');
content.split('\n').forEach((line, idx) => {
  if (line.includes('supabase')) console.log(`${idx+1}: ${line}`);
});
