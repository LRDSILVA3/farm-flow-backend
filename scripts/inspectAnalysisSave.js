const fs = require('fs');
const analysisPage = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/AnalysisPage.tsx', 'utf8');

const saveIdx = analysisPage.indexOf('api.post');
console.log(analysisPage.substring(saveIdx - 50, saveIdx + 300));
