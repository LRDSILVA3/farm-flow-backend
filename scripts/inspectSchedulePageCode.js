const fs = require('fs');
const sched = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/SchedulePage.tsx', 'utf8');
console.log('SchedulePage length:', sched.length);
console.log(sched.substring(0, 1500));
