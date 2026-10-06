const fs = require('fs');
const sched = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/SchedulePage.tsx', 'utf8');

const matches = sched.match(/const\s+handle\w+Execution[\s\S]*?\n\s*\};/g);
console.log('Execution handler matches:');
matches?.forEach(m => console.log(m.substring(0, 300)));
