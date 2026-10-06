const fs = require('fs');
const path = require('path');

function searchWidth(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      searchWidth(full);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.css') || f.endsWith('.html')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((l, idx) => {
        if (l.includes('max-w-') || l.includes('container') || l.includes('w-screen') || l.includes('w-[1') || l.includes('w-[2') || l.includes('w-[3') || l.includes('w-[4') || l.includes('w-[5') || l.includes('w-[6') || l.includes('w-[7') || l.includes('w-[8') || l.includes('w-[9')) {
          console.log(`${f}:${idx+1}: ${l.trim()}`);
        }
      });
    }
  }
}

searchWidth('c:/Users/User/Documents/Projects/farm-flow-frontend/src');
