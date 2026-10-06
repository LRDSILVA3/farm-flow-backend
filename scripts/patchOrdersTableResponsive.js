const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/orders/OrdersTable.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// Wrap table with overflow-x-auto and min-width
content = content.replace(
  '      <div className="space-y-4">\n        <Table>',
  '      <div className="space-y-4">\n        <div className="overflow-x-auto w-full -mx-4 sm:mx-0 px-4 sm:px-0">\n          <Table className="min-w-[850px] w-full text-xs sm:text-sm">'
);

content = content.replace(
  '          </TableBody>\n        </Table>\n\n        {/* Pagination Controls */}',
  '          </TableBody>\n          </Table>\n        </div>\n\n        {/* Pagination Controls */}'
);

// Make pagination responsive
content = content.replace(
  '        {/* Pagination Controls */}\n        <div className="flex items-center justify-between">',
  '        {/* Pagination Controls */}\n        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">'
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('✅ OrdersTable.tsx patched with responsive horizontal scroll and mobile pagination!');
