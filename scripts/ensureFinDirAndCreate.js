const fs = require('fs');
const path = require('path');

const targetDir = 'c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/financial';
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Re-run creation
require('./createFinancialTransactionsTab.js');
