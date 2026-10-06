const fs = require('fs');
const srv = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/settings/ServicesTab.tsx', 'utf8');
const grp = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/settings/ServiceGroupsTab.tsx', 'utf8');
console.log('ServicesTab:', srv.substring(0, 1000));
console.log('ServiceGroupsTab:', grp.substring(0, 1000));
