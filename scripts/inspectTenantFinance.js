const fs = require('fs');
const path = require('path');

const tenantDir = 'c:/Users/User/Documents/Projects/tenant-finance-flow';

function searchFiles(dir, filter) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        if (!['node_modules', '.git', 'dist'].includes(file)) {
          results = results.concat(searchFiles(fullPath, filter));
        }
      } else if (filter.test(file)) {
        results.push(fullPath);
      }
    }
  } catch (err) {}
  return results;
}

const financeFiles = searchFiles(path.join(tenantDir, 'src'), /(financ|lancamento|transaction|category|cash)/i);
console.log('Finance related files in tenant-finance-flow:');
financeFiles.forEach(f => console.log(f.replace(tenantDir, '')));
