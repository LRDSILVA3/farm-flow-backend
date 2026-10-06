const fs = require('fs');
const path = require('path');

// 1. Patch CustomersTable.tsx
const custPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/customers/CustomersTable.tsx');
let custContent = fs.readFileSync(custPath, 'utf8');

custContent = custContent.replace(
  '    <div className="space-y-4">\n      <Table>',
  '    <div className="space-y-4">\n      <div className="overflow-x-auto w-full -mx-4 sm:mx-0 px-4 sm:px-0">\n        <Table className="min-w-[700px] w-full text-xs sm:text-sm">'
);

custContent = custContent.replace(
  '        </TableBody>\n      </Table>\n\n      <div className="flex items-center justify-between">',
  '        </TableBody>\n        </Table>\n      </div>\n\n      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">'
);

fs.writeFileSync(custPath, custContent, 'utf8');
console.log('✅ CustomersTable.tsx wrapped with responsive overflow-x-auto!');

// 2. Patch FarmTable.tsx
const farmPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/farms/FarmTable.tsx');
let farmContent = fs.readFileSync(farmPath, 'utf8');

farmContent = farmContent.replace(
  '    <div className="space-y-4">\n      <Table>',
  '    <div className="space-y-4">\n      <div className="overflow-x-auto w-full -mx-4 sm:mx-0 px-4 sm:px-0">\n        <Table className="min-w-[750px] w-full text-xs sm:text-sm">'
);

farmContent = farmContent.replace(
  '        </TableBody>\n      </Table>\n\n      <div className="flex items-center justify-between">',
  '        </TableBody>\n        </Table>\n      </div>\n\n      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">'
);

fs.writeFileSync(farmPath, farmContent, 'utf8');
console.log('✅ FarmTable.tsx wrapped with responsive overflow-x-auto!');
