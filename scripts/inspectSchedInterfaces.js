const fs = require('fs');
const sched = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/SchedulePage.tsx', 'utf8');
console.log('Total characters in SchedulePage:', sched.length);
// Let's print the interfaces and state
const topPart = sched.substring(0, 2500);
console.log(topPart);
