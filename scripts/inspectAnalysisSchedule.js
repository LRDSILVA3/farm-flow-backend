const fs = require('fs');

const analysisPage = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/AnalysisPage.tsx', 'utf8');
const schedulePage = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/SchedulePage.tsx', 'utf8');

console.log('--- AnalysisPage.tsx supabase usage ---');
analysisPage.split('\n').forEach((line, idx) => {
  if (line.includes('supabase')) console.log(`${idx+1}: ${line}`);
});

console.log('\n--- SchedulePage.tsx supabase usage ---');
schedulePage.split('\n').forEach((line, idx) => {
  if (line.includes('supabase')) console.log(`${idx+1}: ${line}`);
});
