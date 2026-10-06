const fs = require('fs');
const sched = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/SchedulePage.tsx', 'utf8');

const effIdx = sched.indexOf('useEffect');
console.log(sched.substring(effIdx, effIdx + 1500));
