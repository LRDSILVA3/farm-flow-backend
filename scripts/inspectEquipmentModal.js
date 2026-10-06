const fs = require('fs');
const modal = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/settings/EquipmentModal.tsx', 'utf8');
console.log('EquipmentModal:', modal.substring(0, 1000));
