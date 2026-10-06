const fs = require('fs');
const analysisPage = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/AnalysisPage.tsx', 'utf8');
console.log('AnalysisPage:', analysisPage.substring(0, 1500));
