const fs = require('fs');

const files = [
  'c:/Users/User/Documents/Projects/farm-flow-frontend/src/App.tsx',
  'c:/Users/User/Documents/Projects/farm-flow-frontend/src/index.css',
  'c:/Users/User/Documents/Projects/farm-flow-frontend/src/pages/Index.tsx',
  'c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/ui/sidebar.tsx',
  'c:/Users/User/Documents/Projects/farm-flow-frontend/index.html'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    console.log(`\n================ ${f} ================`);
    console.log(fs.readFileSync(f, 'utf8'));
  }
});
