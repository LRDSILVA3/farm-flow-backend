const fs = require('fs');
const path = require('path');

// 1. Atualizar ServiceGroupModal.tsx
const modalPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/settings/ServiceGroupModal.tsx');
const newModalContent = `
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ServiceGroup } from "../../../hooks/useServiceGroups";

export interface ServiceOption {
  id: string;
  name: string;
}

interface ServiceGroupModalProps {
  showServiceGroupForm: boolean;
  setShowServiceGroupForm: (value: boolean) => void;
  editingServiceGroup: ServiceGroup | null;
  serviceGroupFormData: ServiceGroup;
  handleServiceGroupSubmit: (e: React.FormEvent) => void;
  resetServiceGroupForm: () => void;
  handleServiceGroupInputChange: (field: keyof ServiceGroup, value: string | string[]) => void;
  availableServices?: ServiceOption[];
}

const DEFAULT_OFFICIAL_SERVICES: ServiceOption[] = [
  { id: "serv-ap", name: "Amostragem de Solo (AP)" },
  { id: "serv-conf", name: "Conferência de Amostragem" },
  { id: "serv-foliar", name: "Coleta Foliar" },
  { id: "serv-drone-map", name: "Voo de Drone (Mapeamento)" },
  { id: "serv-drone-pulve", name: "Pulverização Drone" },
  { id: "serv-compacta", name: "Compactação de Solo" },
  { id: "serv-atv", name: "Aplicação ATV (Sistematização)" },
  { id: "serv-equaliza", name: "Sistema Equaliza (Multi-anual)" },
  { id: "serv-condut", name: "Condutividade Elétrica" },
];

export const ServiceGroupModal: React.FC<ServiceGroupModalProps> = ({
  showServiceGroupForm,
  setShowServiceGroupForm,
  editingServiceGroup,
  serviceGroupFormData,
  handleServiceGroupSubmit,
  resetServiceGroupForm,
  handleServiceGroupInputChange,
  availableServices = DEFAULT_OFFICIAL_SERVICES,
}) => {
  const servicesToRender = availableServices && availableServices.length > 0
    ? availableServices
    : DEFAULT_OFFICIAL_SERVICES;

  const handleServiceChange = (serviceId: string, checked: boolean) => {
    const current = serviceGroupFormData.servicesIds || [];
    if (checked) {
      handleServiceGroupInputChange("servicesIds", [...current, serviceId]);
    } else {
      handleServiceGroupInputChange("servicesIds", current.filter(id => id !== serviceId));
    }
  };

  return (
    <Dialog open={showServiceGroupForm} onOpenChange={setShowServiceGroupForm}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingServiceGroup ? "Editar Grupo de Serviço" : "Novo Grupo de Serviço"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleServiceGroupSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome do Grupo</Label>
              <Input
                id="name"
                value={serviceGroupFormData.name}
                onChange={(e) => handleServiceGroupInputChange("name", e.target.value)}
                placeholder="Ex: Pacote Completo Solo & Drone"
                required
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={serviceGroupFormData.status} onValueChange={(value) => handleServiceGroupInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={serviceGroupFormData.description}
              onChange={(e) => handleServiceGroupInputChange("description", e.target.value)}
              placeholder="Ex: Pacote oficial com serviços de amostragem e tecnologia de precisão"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="font-semibold">Serviços da Planilha / Sistema Inclusos</Label>
              <span className="text-xs text-muted-foreground">
                {(serviceGroupFormData.servicesIds || []).length} selecionado(s)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-muted/20 border rounded-md max-h-56 overflow-y-auto">
              {servicesToRender.map((service) => {
                const isChecked = (serviceGroupFormData.servicesIds || []).includes(service.id) ||
                                  (serviceGroupFormData.servicesIds || []).includes(service.name);
                return (
                  <div key={service.id} className="flex items-center space-x-2 py-1 px-2 rounded hover:bg-muted/40 transition-colors">
                    <Checkbox
                      id={\`service-\${service.id}\`}
                      checked={isChecked}
                      onCheckedChange={(checked) => handleServiceChange(service.id, checked as boolean)}
                    />
                    <Label htmlFor={\`service-\${service.id}\`} className="cursor-pointer text-xs font-normal">
                      {service.name}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="outline" onClick={resetServiceGroupForm}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              {editingServiceGroup ? "Atualizar Grupo" : "Criar Grupo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
`;

fs.writeFileSync(modalPath, newModalContent.trim(), 'utf8');
console.log('✅ ServiceGroupModal.tsx updated with official spreadsheet services!');

// 2. Atualizar usePlan.ts para remover os mocks antigos
const planPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/settings/usePlan.ts');
if (fs.existsSync(planPath)) {
  let planContent = fs.readFileSync(planPath, 'utf8');
  planContent = planContent.replace(/\{ id: 1, name: "Pulverização" \},?\s*\{ id: 2, name: "Plantio" \},?\s*\{ id: 3, name: "Colheita" \},?\s*\{ id: 4, name: "Adubação" \}/g, 
`{ id: 1, name: "Amostragem de Solo (AP)" },
    { id: 2, name: "Conferência de Amostragem" },
    { id: 3, name: "Voo de Drone (Mapeamento)" },
    { id: 4, name: "Pulverização Drone" },
    { id: 5, name: "Coleta Foliar" },
    { id: 6, name: "Compactação de Solo" }`);
  fs.writeFileSync(planPath, planContent, 'utf8');
  console.log('✅ usePlan.ts updated with official spreadsheet services!');
}
