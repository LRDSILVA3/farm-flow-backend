const XLSX = require('../../farm-flow-frontend/node_modules/xlsx');

// M31 is 44956 (30/01/2023)
// Let's test two possibilities for D32:
// 1. 01/11/2026 (1 Nov 2026)
// 2. 11/01/2026 (11 Jan 2026)

// Date code 44956 is 2023-01-30
const baseM31 = new Date(2023, 0, 30); // 30 Jan 2023

console.log('Base M31:', baseM31);

// Possibility A: 01/11/2026
const dA = new Date(2026, 10, 1);
const daysA = (dA - baseM31) / (1000 * 60 * 60 * 24);
const jurosA = Math.pow(1.03, daysA / 30);
console.log('Possibility A (01/11/2026): days =', daysA, 'juros =', jurosA);

// Possibility B: 11/01/2026
const dB = new Date(2026, 0, 11);
const daysB = (dB - baseM31) / (1000 * 60 * 60 * 24);
const jurosB = Math.pow(1.03, daysB / 30);
console.log('Possibility B (11/01/2026): days =', daysB, 'juros =', jurosB);

// Now, let's see what base gives 193.033 and 19.141:
// In the screenshot:
// I40 = 193.03
// I41 = 19.14
console.log('\nWith jurosA (' + jurosA + '):');
console.log('  193.033 / jurosA =', 193.033 / jurosA);
console.log('  19.141 / jurosA =', 19.141 / jurosA);

console.log('\nWith jurosB (' + jurosB + '):');
console.log('  193.033 / jurosB =', 193.033 / jurosB);
console.log('  19.141 / jurosB =', 19.141 / jurosB);
