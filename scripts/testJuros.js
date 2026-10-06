const XLSX = require('../../farm-flow-frontend/node_modules/xlsx');

// Let's test DAYS(vencimento, 45657)
// If vencimento is 2026-11-01 vs 2026-01-11
const baseDate = new Date(2024, 11, 31); // 45657 in Excel is 2024-12-31 (or 2025-01-01)
console.log('Base date:', baseDate);

// Excel date 45657
// Let's check XLSX.SSF.parse_date_code(45657)
console.log('45657 as date:', XLSX.SSF.parse_date_code(45657));

// Scenario 1: Date is 2026-11-01 (1 Nov 2026)
const d1 = new Date(2026, 10, 1);
const days1 = (d1 - new Date(2024, 11, 31)) / (1000 * 60 * 60 * 24);
console.log('Days to 01/11/2026:', days1);
console.log('POWER(1.03, days/30):', Math.pow(1.03, days1 / 30));
console.log('POWER(1.015, days/30):', Math.pow(1.015, days1 / 30));

// Scenario 2: Date is 2026-01-11 (11 Jan 2026)
const d2 = new Date(2026, 0, 11);
const days2 = (d2 - new Date(2024, 11, 31)) / (1000 * 60 * 60 * 24);
console.log('Days to 11/01/2026:', days2);
console.log('POWER(1.03, days/30):', Math.pow(1.03, days2 / 30));
console.log('POWER(1.015, days/30):', Math.pow(1.015, days2 / 30));
