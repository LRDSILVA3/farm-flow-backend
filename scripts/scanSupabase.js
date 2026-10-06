const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/User/Documents/Projects/farm-flow-frontend/src';

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('supabase') || content.includes('@supabase/supabase-js')) {
        console.log(`Found supabase in: ${fullPath}`);
      }
    }
  }
}

scanDir(srcDir);
console.log('Scan complete.');
