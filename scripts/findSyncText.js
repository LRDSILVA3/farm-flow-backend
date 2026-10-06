const fs = require('fs');
const path = require('path');

function search(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      search(p);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      const txt = fs.readFileSync(p, 'utf8');
      if (txt.includes('budget.xlsm') || txt.includes('Sincronizado')) {
        console.log(`Found in: ${p}`);
      }
    }
  }
}

search('c:/Users/User/Documents/Projects/farm-flow-frontend/src');
