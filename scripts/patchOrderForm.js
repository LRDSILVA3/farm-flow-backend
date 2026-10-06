const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/orders/OrderForm.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Add Pulverização com Drone and Sistema Equaliza to SelectContent
const oldSelectContent = `                <SelectItem value="Aplicaǜo ATV">Aplicaǜo ATV</SelectItem>
                <SelectItem value="Amostragem de Solo (AP)">Amostragem de Solo (AP)</SelectItem>
              </SelectContent>`;

const newSelectContent = `                <SelectItem value="Aplicaǜo ATV">Aplicaǜo ATV</SelectItem>
                <SelectItem value="Amostragem de Solo (AP)">Amostragem de Solo (AP)</SelectItem>
                <SelectItem value="Pulverizaǜo com Drone">Pulverizaǜo com Drone</SelectItem>
                <SelectItem value="Sistema Equaliza">Sistema Equaliza</SelectItem>
              </SelectContent>`;

content = content.replace(oldSelectContent, newSelectContent);

// 2. Make form buttons touch and mobile friendly
const oldButtons = `          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              {editingOrder ? "Atualizar" : "Criar"}
            </Button>
          </div>`;

const newButtons = `          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
              {editingOrder ? "Atualizar Pedido" : "Criar Pedido"}
            </Button>
          </div>`;

content = content.replace(oldButtons, newButtons);

// 3. Make non-specialized service area/value grid responsive
content = content.replace(
  '<div className="grid grid-cols-2 gap-4">',
  '<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">'
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('✅ OrderForm.tsx patched with all services and responsive layout!');
