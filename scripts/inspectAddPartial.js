const fs = require('fs');
const sched = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/SchedulePage.tsx', 'utf8');

const pIdx = sched.indexOf('handleAddPartialExecution');
console.log(sched.substring(pIdx, pIdx + 1500));
