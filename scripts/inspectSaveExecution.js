const fs = require('fs');
const sched = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/SchedulePage.tsx', 'utf8');

const saveIdx = sched.indexOf('handleSaveExecution');
console.log(sched.substring(saveIdx, saveIdx + 1500));
