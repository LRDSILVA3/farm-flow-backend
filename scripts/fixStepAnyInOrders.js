const fs = require('fs');
const path = require('path');

const ordersDir = 'c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders';
const files = fs.readdirSync(ordersDir).filter(f => f.endsWith('.tsx'));

let modifiedCount = 0;

files.forEach(file => {
  const fullPath = path.join(ordersDir, file);
  let content = fs.readFileSync(fullPath, 'utf8');
  let original = content;

  // Replace type="number" without step with type="number" step="any"
  // For Input components: <Input ... type="number" ... />
  // We can add step="any" whenever type="number" is present and step is missing
  content = content.replace(/type="number"(?![^>]*step=)/g, 'type="number" step="any"');

  if (content !== original) {
    fs.writeFileSync(fullPath, content);
    console.log(`Updated number inputs with step="any" in ${file}`);
    modifiedCount++;
  }
});

console.log(`Finished updating ${modifiedCount} files.`);
