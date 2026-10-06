const fs = require('fs');
const sched = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/SchedulePage.tsx', 'utf8');

const tableIdx = sched.indexOf('<Table>');
console.log(sched.substring(tableIdx, tableIdx + 2000));
