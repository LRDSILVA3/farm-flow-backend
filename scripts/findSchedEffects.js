const fs = require('fs');
const sched = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/SchedulePage.tsx', 'utf8');

let pos = 0;
while (true) {
  const idx = sched.indexOf('useEffect(', pos);
  if (idx === -1) break;
  console.log(`\n=== useEffect at pos ${idx} ===`);
  console.log(sched.substring(idx, idx + 400));
  pos = idx + 10;
}
