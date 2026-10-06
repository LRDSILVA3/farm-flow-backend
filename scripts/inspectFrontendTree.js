const fs = require('fs');
const path = require('path');

const frontendDir = 'c:/Users/User/Documents/Projects/farm-flow-frontend/src';

function listComponents(dir, prefix = '') {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      console.log(`${prefix}📁 ${item}/`);
      listComponents(full, prefix + '  ');
    } else {
      console.log(`${prefix}📄 ${item}`);
    }
  }
}

listComponents(frontendDir);
