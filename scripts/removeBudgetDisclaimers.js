const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders';
const files = fs.readdirSync(dir);

let count = 0;
for (const file of files) {
  if (file.endsWith('.tsx')) {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes('budget.xlsm')) {
      // Remove the span or p tag containing budget.xlsm
      content = content.replace(/<span[^>]*class(?:Name)?="[^"]*text-muted-foreground[^"]*"[^>]*>[\s\S]*?Sincronizado com budget\.xlsm[\s\S]*?<\/span>/g, '');
      content = content.replace(/<p[^>]*class(?:Name)?="[^"]*text-muted-foreground[^"]*"[^>]*>[\s\S]*?Sincronizado com budget\.xlsm[\s\S]*?<\/p>/g, '');
      content = content.replace(/Sincronizado com budget\.xlsm[^\n<]*/g, '');
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Cleaned ${file}`);
      count++;
    }
  }
}
console.log(`Finished removing budget.xlsm disclaimers from ${count} files.`);
