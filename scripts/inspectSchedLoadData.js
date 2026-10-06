const fs = require('fs');
const sched = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/SchedulePage.tsx', 'utf8');

const loadIdx = sched.indexOf('const loadData =');
console.log(sched.substring(loadIdx, loadIdx + 1500));
