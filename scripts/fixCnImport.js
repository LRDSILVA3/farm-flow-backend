const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/orders/OrdersTable.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('import { cn } from "@/lib/utils";')) {
  content = 'import { cn } from "@/lib/utils";\n' + content;
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully added cn import to OrdersTable.tsx');
} else {
  console.log('cn import already present');
}
