const fs = require('fs');

// 1. Update CityStateSelect.tsx to include data-testid="state-select" and data-testid="city-select"
let cityStateCode = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/farms/CityStateSelect.tsx', 'utf8');
cityStateCode = cityStateCode.replace('id="stateSelect"', 'id="stateSelect" data-testid="state-select" value={state}');
cityStateCode = cityStateCode.replace('id="citySelect"', 'id="citySelect" data-testid="city-select" value={city}');
fs.writeFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/farms/CityStateSelect.tsx', cityStateCode, 'utf8');

// 2. In PlotForm.tsx:
// - Keep standard Lote -> Matrícula
// - Keep optional fields
// - Button text: "Adicionar" (create) and "Atualizar" (edit) to satisfy test and UX
// - Labels: "Nome do Talhão", "Área (ha)", "Cidade", "Estado", "Lote", "Matrícula"
const plotFormCode = `import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plot } from "@/types/farm";
import { AlertCircle } from "lucide-react";

interface PlotFormProps {
  plotForm: Plot;
  setPlotForm: (plot: Plot) => void;
  editingPlot: Plot | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const PlotForm = ({
  plotForm,
  setPlotForm,
  editingPlot,
  onSubmit,
  onCancel
}: PlotFormProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!plotForm.name?.trim()) {
      newErrors.name = "Nome do talhão é obrigatório";
    }
    if (!plotForm.area || parseFloat(plotForm.area) < 0) {
      newErrors.area = "Informe uma área válida em hectares";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    onSubmit(e);
  };

  return (
    <form onSubmit={handleFormSubmit} className="bg-gray-50 p-4 rounded-lg border space-y-4">
      <h5 className="font-semibold text-base">
        {editingPlot ? "Editar Talhão" : "Adicionar Novo Talhão"}
      </h5>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="plotName">Nome do Talhão</Label>
          <Input
            id="plotName"
            value={plotForm.name}
            onChange={(e) => {
              setPlotForm({ ...plotForm, name: e.target.value });
              if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
            }}
            placeholder="Ex: Talhão 01 - Sede"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.name}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="plotArea">Área (ha)</Label>
          <Input
            id="plotArea"
            type="number"
            step="0.01"
            value={plotForm.area}
            onChange={(e) => {
              setPlotForm({ ...plotForm, area: e.target.value });
              if (errors.area) setErrors(prev => ({ ...prev, area: "" }));
            }}
            placeholder="0.00"
            className={errors.area ? "border-red-500" : ""}
          />
          {errors.area && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.area}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="plotCity">Cidade</Label>
          <Input
            id="plotCity"
            value={plotForm.city || ""}
            onChange={(e) => setPlotForm({ ...plotForm, city: e.target.value })}
            placeholder="Cidade"
          />
        </div>

        <div>
          <Label htmlFor="plotState">Estado</Label>
          <Input
            id="plotState"
            value={plotForm.state || ""}
            onChange={(e) => setPlotForm({ ...plotForm, state: e.target.value })}
            placeholder="UF"
          />
        </div>

        {/* Ordem Padronizada: LOTE primeiro, depois MATRÍCULA (Ambos Opcionais) */}
        <div>
          <Label htmlFor="plotLot">Lote</Label>
          <Input
            id="plotLot"
            value={plotForm.lot || ""}
            onChange={(e) => setPlotForm({ ...plotForm, lot: e.target.value })}
            placeholder="Ex: Lote 04 (Opcional)"
          />
        </div>

        <div>
          <Label htmlFor="plotRegistration">Matrícula</Label>
          <Input
            id="plotRegistration"
            value={plotForm.registration || ""}
            onChange={(e) => setPlotForm({ ...plotForm, registration: e.target.value })}
            placeholder="Ex: 56.789 (Opcional)"
          />
        </div>

        <div>
          <Label htmlFor="plotStatus">Status</Label>
          <Select value={plotForm.status} onValueChange={(value) => setPlotForm({ ...plotForm, status: value })}>
            <SelectTrigger id="plotStatus">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-green-600 hover:bg-green-700">
          {editingPlot ? "Atualizar" : "Adicionar"}
        </Button>
      </div>
    </form>
  );
};
`;

fs.writeFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/farms/PlotForm.tsx', plotFormCode, 'utf8');

// 3. In FarmForm.tsx: Button text "Criar" (create) and "Atualizar" (edit)
let farmFormContent = fs.readFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/farms/FarmForm.tsx', 'utf8');
farmFormContent = farmFormContent.replace('Criar Fazenda', 'Criar');
farmFormContent = farmFormContent.replace('Atualizar Fazenda', 'Atualizar');
fs.writeFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/farms/FarmForm.tsx', farmFormContent, 'utf8');

console.log('Successfully aligned spec test IDs and button labels!');
