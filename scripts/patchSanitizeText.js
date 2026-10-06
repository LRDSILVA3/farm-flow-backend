const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../farm-flow-frontend/src/hooks/useOrders.ts');
let content = fs.readFileSync(targetPath, 'utf8');

const sanitizeFunction = `
const sanitizeText = (str: string | null | undefined): string => {
  if (!str) return '';
  return str
    .replace(/\\uFFFD/g, 'ê')
    .replace(/Confer[\?]ncia/g, 'Conferência');
};
`;

if (!content.includes('const sanitizeText =')) {
  content = sanitizeFunction + content;
  content = content.replace(
    'serviceName: db.service_name || db.type || "Serviço",',
    'serviceName: sanitizeText(db.service_name || db.type || "Serviço"),'
  );
  content = content.replace(
    'type: db.type || "Serviço",',
    'type: sanitizeText(db.type || "Serviço"),'
  );
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log('Successfully added sanitizeText to useOrders.ts');
} else {
  console.log('sanitizeText already present');
}
