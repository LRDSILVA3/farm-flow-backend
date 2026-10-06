const fs = require('fs');
const settings = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/SettingsPage.tsx', 'utf8');
console.log('SettingsPage tabs:', settings.substring(0, 1500));
