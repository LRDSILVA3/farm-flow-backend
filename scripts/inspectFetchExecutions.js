const fs = require('fs');
const sched = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/SchedulePage.tsx', 'utf8');

const fIdx = sched.indexOf('const fetchExecutions =');
console.log(sched.substring(fIdx, fIdx + 1200));
