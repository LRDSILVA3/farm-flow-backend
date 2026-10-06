const fs = require('fs');
const path = require('path');

// 1. Atualizar useEquipment.ts
const useEquipmentPath = path.resolve(__dirname, '../../farm-flow-frontend/src/hooks/useEquipment.ts');
const newUseEquipmentContent = `
import { useState, useEffect, FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";

export interface Equipment {
  id: string;
  name: string;
  type?: "Veículo" | "Ferramenta" | "Outro" | string;
  model?: string;
  plate?: string;
  serialNumber?: string;
  hourmeter?: string;
  year?: string;
  notes?: string;
  status: string;
}

export const useEquipment = () => {
  const { toast } = useToast();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [equipmentPage, setEquipmentPage] = useState(1);
  const [equipmentPerPage, setEquipmentPerPage] = useState(10);
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [equipmentFormData, setEquipmentFormData] = useState<Equipment>({
    id: "",
    name: "",
    type: "Veículo",
    model: "",
    plate: "",
    serialNumber: "",
    hourmeter: "",
    year: "",
    notes: "",
    status: "Disponível"
  });

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const data = await api.get<any[]>('/equipment');
      if (Array.isArray(data)) {
        setEquipment(data.map(e => ({
          id: e.id,
          name: e.name || "",
          type: e.type || "Veículo",
          model: e.model || "",
          plate: e.plate || "",
          serialNumber: e.serial_number || e.serialNumber || "",
          hourmeter: e.hourmeter || "",
          year: e.year || "",
          notes: e.notes || "",
          status: e.status || "Disponível"
        })));
      }
    } catch (error: any) {
      toast({ title: "Erro ao carregar equipamentos", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const handleEquipmentInputChange = (field: keyof Equipment, value: any) => {
    setEquipmentFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEquipmentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: equipmentFormData.name,
        type: equipmentFormData.type || "Veículo",
        model: equipmentFormData.model || null,
        plate: equipmentFormData.plate || null,
        serial_number: equipmentFormData.serialNumber || null,
        hourmeter: equipmentFormData.hourmeter || null,
        year: equipmentFormData.year || null,
        notes: equipmentFormData.notes || null,
        status: equipmentFormData.status
      };

      if (editingEquipment) {
        await api.put(\`/equipment/\${editingEquipment.id}\`, payload);
        toast({ title: "Equipamento atualizado", description: "O equipamento foi atualizado com sucesso." });
      } else {
        await api.post('/equipment', payload);
        toast({ title: "Equipamento cadastrado", description: "O equipamento foi cadastrado com sucesso." });
      }
      resetEquipmentForm();
      await fetchEquipment();
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    }
  };

  const handleEditEquipment = (item: Equipment) => {
    setEditingEquipment(item);
    setEquipmentFormData(item);
    setShowEquipmentForm(true);
  };

  const handleDeleteEquipment = async (id: string) => {
    try {
      await api.delete(\`/equipment/\${id}\`);
      toast({ title: "Equipamento removido", description: "Equipamento excluído com sucesso." });
      await fetchEquipment();
    } catch (error: any) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  };

  const resetEquipmentForm = () => {
    setShowEquipmentForm(false);
    setEditingEquipment(null);
    setEquipmentFormData({
      id: "",
      name: "",
      type: "Veículo",
      model: "",
      plate: "",
      serialNumber: "",
      hourmeter: "",
      year: "",
      notes: "",
      status: "Disponível"
    });
  };

  const totalEquipment = equipment.length;
  const totalEquipmentPages = Math.max(1, Math.ceil(totalEquipment / (equipmentPerPage || 10)));
  const safePage = Math.min(equipmentPage, totalEquipmentPages);
  const equipmentStartIndex = (safePage - 1) * (equipmentPerPage || 10);
  const equipmentEndIndex = equipmentStartIndex + (equipmentPerPage || 10);
  const paginatedEquipment = equipment.slice(equipmentStartIndex, equipmentEndIndex);

  return {
    equipment: paginatedEquipment,
    allEquipment: equipment,
    loading,
    equipmentPage: safePage,
    setEquipmentPage,
    equipmentPerPage,
    setEquipmentPerPage,
    totalEquipment,
    totalEquipmentPages,
    equipmentStartIndex,
    equipmentEndIndex,
    showEquipmentForm,
    setShowEquipmentForm,
    editingEquipment,
    setEditingEquipment,
    equipmentFormData,
    setEquipmentFormData,
    handleEquipmentInputChange,
    handleInputChange: handleEquipmentInputChange,
    handleEquipmentSubmit,
    handleSaveEquipment: handleEquipmentSubmit,
    handleEditEquipment,
    handleDeleteEquipment,
    resetEquipmentForm,
    refetch: fetchEquipment
  };
};
`;
fs.writeFileSync(useEquipmentPath, newUseEquipmentContent.trim(), 'utf8');
console.log('✅ useEquipment.ts updated with typed attributes!');

// 2. Atualizar EquipmentModal.tsx
const modalPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/settings/EquipmentModal.tsx');
const newModalContent = `
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Truck, Wrench, Package } from "lucide-react";
import { Equipment } from "../../../hooks/useEquipment";

interface EquipmentModalProps {
  showEquipmentForm: boolean;
  setShowEquipmentForm: (value: boolean) => void;
  editingEquipment: Equipment | null;
  equipmentFormData: Equipment;
  handleEquipmentSubmit: (e: React.FormEvent) => void;
  resetEquipmentForm: () => void;
  handleEquipmentInputChange: (field: keyof Equipment, value: string) => void;
}

export const EquipmentModal: React.FC<EquipmentModalProps> = ({
  showEquipmentForm,
  setShowEquipmentForm,
  editingEquipment,
  equipmentFormData,
  handleEquipmentSubmit,
  resetEquipmentForm,
  handleEquipmentInputChange
}) => {
  const currentType = equipmentFormData.type || "Veículo";

  return (
    <Dialog open={showEquipmentForm} onOpenChange={setShowEquipmentForm}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentType === "Veículo" && <Truck className="h-5 w-5 text-blue-600" />}
            {currentType === "Ferramenta" && <Wrench className="h-5 w-5 text-purple-600" />}
            {currentType === "Outro" && <Package className="h-5 w-5 text-amber-600" />}
            {editingEquipment ? "Editar Equipamento" : "Novo Equipamento"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleEquipmentSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="equipamentoNome">Nome / Identificação *</Label>
              <Input
                id="equipamentoNome"
                placeholder="Ex: Hilux Prata, Drone DJI Agras T40, Quadriciclo"
                value={equipmentFormData.name}
                onChange={(e) => handleEquipmentInputChange("name", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="equipamentoTipo">Tipo de Equipamento</Label>
              <Select 
                value={equipmentFormData.type || "Veículo"} 
                onValueChange={(value) => handleEquipmentInputChange("type", value)}
              >
                <SelectTrigger id="equipamentoTipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Veículo">Veículo (Carro, Caminhonete, Caminhão, Quadriciclo)</SelectItem>
                  <SelectItem value="Ferramenta">Ferramenta / Maquinário (Drone, Penetômetro, Trator, GPS)</SelectItem>
                  <SelectItem value="Outro">Outro (Acessório, Equipamento de Apoio)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="equipamentoStatus">Status Operacional</Label>
              <Select value={equipmentFormData.status} onValueChange={(value) => handleEquipmentInputChange("status", value)}>
                <SelectTrigger id="equipamentoStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Disponível">Disponível</SelectItem>
                  <SelectItem value="Em Uso">Em Uso / Em Campo</SelectItem>
                  <SelectItem value="Em Manutenção">Em Manutenção</SelectItem>
                  <SelectItem value="Indisponível">Indisponível</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="equipamentoModelo">Modelo / Marca</Label>
              <Input
                id="equipamentoModelo"
                placeholder="Ex: Toyota Hilux SRX, DJI T40"
                value={equipmentFormData.model || ""}
                onChange={(e) => handleEquipmentInputChange("model", e.target.value)}
              />
            </div>
          </div>

          {/* CAMPOS ESPECÍFICOS PARA VEÍCULO */}
          {currentType === "Veículo" && (
            <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg space-y-3">
              <span className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" />
                Dados do Veículo (Opcionais)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="equipamentoPlaca" className="text-xs">Placa do Veículo</Label>
                  <Input
                    id="equipamentoPlaca"
                    placeholder="Ex: ABC-1D23"
                    value={equipmentFormData.plate || ""}
                    onChange={(e) => handleEquipmentInputChange("plate", e.target.value.toUpperCase())}
                    className="h-8 text-xs font-mono uppercase"
                  />
                </div>
                <div>
                  <Label htmlFor="equipamentoAno" className="text-xs">Ano Fabricação</Label>
                  <Input
                    id="equipamentoAno"
                    placeholder="Ex: 2023"
                    value={equipmentFormData.year || ""}
                    onChange={(e) => handleEquipmentInputChange("year", e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="equipamentoKm" className="text-xs">Km Atual / Horímetro</Label>
                  <Input
                    id="equipamentoKm"
                    placeholder="Ex: 45.000 km"
                    value={equipmentFormData.hourmeter || ""}
                    onChange={(e) => handleEquipmentInputChange("hourmeter", e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CAMPOS ESPECÍFICOS PARA FERRAMENTA */}
          {currentType === "Ferramenta" && (
            <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-lg space-y-3">
              <span className="text-xs font-semibold text-purple-900 flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5" />
                Dados da Ferramenta / Maquinário (Opcionais)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="equipamentoSerial" className="text-xs">Número de Série</Label>
                  <Input
                    id="equipamentoSerial"
                    placeholder="Ex: SN-987654321"
                    value={equipmentFormData.serialNumber || ""}
                    onChange={(e) => handleEquipmentInputChange("serialNumber", e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="equipamentoHorimetro" className="text-xs">Horímetro / Horas de Voo</Label>
                  <Input
                    id="equipamentoHorimetro"
                    placeholder="Ex: 120 horas"
                    value={equipmentFormData.hourmeter || ""}
                    onChange={(e) => handleEquipmentInputChange("hourmeter", e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CAMPOS PARA OUTROS OU OBSERVAÇÕES GERAIS */}
          <div>
            <Label htmlFor="equipamentoNotas">Observações Adicionais</Label>
            <Textarea
              id="equipamentoNotas"
              placeholder="Histórico de manutenções, acessórios vinculados ou observações de campo..."
              value={equipmentFormData.notes || ""}
              onChange={(e) => handleEquipmentInputChange("notes", e.target.value)}
              rows={2}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={resetEquipmentForm}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              {editingEquipment ? "Atualizar Equipamento" : "Salvar Equipamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
`;
fs.writeFileSync(modalPath, newModalContent.trim(), 'utf8');
console.log('✅ EquipmentModal.tsx updated with contextual inputs!');

// 3. Atualizar EquipmentsTab.tsx
const tabPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/settings/EquipmentsTab.tsx');
let tabContent = fs.readFileSync(tabPath, 'utf8');

// Adicionar import dos ícones
if (!tabContent.includes('Truck, Wrench, Package')) {
  tabContent = tabContent.replace(
    'import { Plus, Edit, Trash2 } from "lucide-react";',
    'import { Plus, Edit, Trash2, Truck, Wrench, Package } from "lucide-react";\nimport { Badge } from "@/components/ui/badge";'
  );
}

// Atualizar o cabeçalho da tabela
tabContent = tabContent.replace(
  `<TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>`,
  `<TableHeader>
                <TableRow>
                  <TableHead>Nome do Equipamento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Identificação / Detalhes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>`
);

// Atualizar a linha da tabela
const oldRowRegex = /<TableRow key=\{item\.id\}>\s*<TableCell className="font-medium">\{item\.name\}<\/TableCell>\s*<TableCell>[\s\S]*?<\/TableCell>\s*<TableCell>\s*<div className="flex gap-1">/;

const newRowMarkup = `<TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{item.name}</div>
                      {item.model && <div className="text-xs text-muted-foreground">{item.model}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={\`text-xs font-normal gap-1 \${
                        item.type === "Veículo" ? "bg-blue-50 text-blue-800 border-blue-200" :
                        item.type === "Ferramenta" ? "bg-purple-50 text-purple-800 border-purple-200" :
                        "bg-slate-50 text-slate-800 border-slate-200"
                      }\`}>
                        {item.type === "Veículo" && <Truck className="h-3 w-3" />}
                        {item.type === "Ferramenta" && <Wrench className="h-3 w-3" />}
                        {item.type === "Outro" && <Package className="h-3 w-3" />}
                        {item.type || "Geral"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.plate ? (
                        <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded font-bold">
                          {item.plate}
                        </code>
                      ) : item.serialNumber ? (
                        <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                          S/N: {item.serialNumber}
                        </code>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={\`px-2 py-1 rounded-full text-xs font-medium \${
                        item.status === "Disponível" 
                          ? "bg-green-100 text-green-800" 
                          : item.status === "Em Uso"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-orange-100 text-orange-800"
                      }\`}>
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">`;

if (oldRowRegex.test(tabContent)) {
  tabContent = tabContent.replace(oldRowRegex, newRowMarkup);
  fs.writeFileSync(tabPath, tabContent, 'utf8');
  console.log('✅ EquipmentsTab.tsx updated with Type and Details columns!');
} else {
  console.log('❌ oldRowRegex in EquipmentsTab did not match');
}
