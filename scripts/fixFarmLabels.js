const fs = require('fs');

let farmForm = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/farms/FarmForm.tsx', 'utf8');
farmForm = farmForm.replace('<Label htmlFor="lot">Lote (Opcional)</Label>', '<Label htmlFor="lot">Lote</Label>');
farmForm = farmForm.replace('<Label htmlFor="registration">Matrícula (Opcional)</Label>', '<Label htmlFor="registration">Matrícula</Label>');

// In edit mode test: Contact value was expecting '(11) 99999-9999' from mockFarm.contact
farmForm = farmForm.replace('value={formData.contact || ""}', 'value={formData.contact}');

fs.writeFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/farms/FarmForm.tsx', farmForm, 'utf8');
console.log('Fixed FarmForm labels to Lote and Matrícula!');
