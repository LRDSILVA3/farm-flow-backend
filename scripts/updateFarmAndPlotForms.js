const fs = require('fs');

const farmFormCode = `import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IMaskInput } from "react-imask";
import { Trash2, Plus, AlertCircle } from "lucide-react";

import { useState, useEffect } from "react";
import { CustomerSelect } from "./CustomerSelect";
import { CityStateSelect } from "./CityStateSelect";
import { Farm } from "@/types/farm";
import { useClients, Client } from "@/hooks/useClients";

interface FarmFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingFarm: Farm | null;
  formData: Farm;
  onInputChange: (field: keyof Farm, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onDeletePlot?: (farmId: string, plotId: string) => void;
  onAddPlot?: (farmId: string) => void;
}

export const FarmForm = ({
  open,
  onOpenChange,
  editingFarm,
  formData,
  onInputChange,
  onSubmit,
  onCancel,
  onDeletePlot,
  onAddPlot
}: FarmFormProps) => {
  const { clients, loading: clientsLoading } = useClients();
  const [customers, setCustomers] = useState<Client[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!clientsLoading) {
      setCustomers(clients);
    }
  }, [clients, clientsLoading]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativo":
        return "bg-green-100 text-green-800";
      case "Inativo":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleAddPlotClick = () => {
    if (!onAddPlot) return;
    const farmId = editingFarm ? editingFarm.id : formData.id || 'temp';
    onAddPlot(farmId);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) {
      newErrors.name = "Nome da fazenda é obrigatório";
    }
    if (!formData.clientId) {
      newErrors.clientId = "Selecione o proprietário";
    }
    if (!formData.area || parseFloat(formData.area) <= 0) {
      newErrors.area = "Informe uma área válida em hectares";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    onSubmit(e);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingFarm ? "Editar Fazenda" : "Nova Fazenda"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleFormSubmit} className="space-y-4" role="form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="font-semibold">
                Nome da Fazenda <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  onInputChange("name", e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                }}
                placeholder="Ex: Fazenda Santa Maria"
                className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.name}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="owner" className="font-semibold">
                Proprietário <span className="text-red-500">*</span>
              </Label>
              <CustomerSelect
                value={formData.clientId}
                onValueChange={(value) => {
                  const selectedCustomer = customers.find(cust => cust.id === value);
                  if (selectedCustomer) {
                    onInputChange("clientId", selectedCustomer.id);
                    onInputChange("clientName", selectedCustomer.name);
                    if (errors.clientId) setErrors(prev => ({ ...prev, clientId: "" }));
                  }
                }}
                customers={customers}
              />
              {errors.clientId && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.clientId}
                </p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="area" className="font-semibold">
                Área Total (ha) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="area"
                type="number"
                step="0.01"
                value={formData.area}
                onChange={(e) => {
                  onInputChange("area", e.target.value);
                  if (errors.area) setErrors(prev => ({ ...prev, area: "" }));
                }}
                placeholder="0.00"
                className={errors.area ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.area && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.area}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="contact">Contato (Opcional)</Label>
              <IMaskInput
                mask="(00) 00000-0000"
                id="contact"
                value={formData.contact || ""}
                onAccept={(value) => onInputChange("contact", value as string)}
                placeholder="(00) 00000-0000"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CityStateSelect
              city={formData.city}
              state={formData.state}
              onCityChange={(value) => onInputChange("city", value)}
              onStateChange={(value) => onInputChange("state", value)}
            />
          </div>

          {/* Ordem Padronizada: Status, LOTE primeiro, depois MATRÍCULA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => onInputChange("status", value)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="lot">Lote (Opcional)</Label>
              <Input
                id="lot"
                value={formData.lot || ""}
                onChange={(e) => onInputChange("lot", e.target.value)}
                placeholder="Ex: Lote 14-B"
              />
            </div>
            <div>
              <Label htmlFor="registration">Matrícula (Opcional)</Label>
              <Input
                id="registration"
                value={formData.registration || ""}
                onChange={(e) => onInputChange("registration", e.target.value)}
                placeholder="Ex: 12.345"
              />
            </div>
          </div>

          {editingFarm && (
            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium">Talhões da Fazenda</h4>
                <Button
                  type="button"
                  onClick={handleAddPlotClick}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Talhão
                </Button>
              </div>
              
              {formData.plots && formData.plots.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Área (ha)</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.plots.map((plot) => (
                      <TableRow key={plot.id}>
                        <TableCell className="font-medium">{plot.name}</TableCell>
                        <TableCell>{parseFloat(plot.area || "0").toFixed(2)} ha</TableCell>
                        <TableCell>{plot.city || "-"}</TableCell>
                        <TableCell>{plot.state || "-"}</TableCell>
                        <TableCell>{plot.lot || "-"}</TableCell>
                        <TableCell>{plot.registration || "-"}</TableCell>
                        <TableCell>
                          <span className={\`px-2 py-1 rounded-full text-xs \${getStatusColor(plot.status)}\`}>
                            {plot.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {onDeletePlot && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => onDeletePlot(formData.id, plot.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-gray-500 text-center py-6 text-sm">
                  Nenhum talhão cadastrado para esta fazenda
                </p>
              )}
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              {editingFarm ? "Atualizar Fazenda" : "Criar Fazenda"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
`;

const plotFormCode = `import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CityStateSelect } from "./CityStateSelect";
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
    if (!plotForm.area || parseFloat(plotForm.area) <= 0) {
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
          <Label htmlFor="plotName" className="font-semibold">
            Nome do Talhão <span className="text-red-500">*</span>
          </Label>
          <Input
            id="plotName"
            value={plotForm.name}
            onChange={(e) => {
              setPlotForm({ ...plotForm, name: e.target.value });
              if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
            }}
            placeholder="Ex: Talhão 01 - Sede"
            className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {errors.name && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.name}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="plotArea" className="font-semibold">
            Área (ha) <span className="text-red-500">*</span>
          </Label>
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
            className={errors.area ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {errors.area && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.area}
            </p>
          )}
        </div>

        <CityStateSelect
          city={plotForm.city || ""}
          state={plotForm.state || ""}
          onCityChange={(city) => setPlotForm({ ...plotForm, city })}
          onStateChange={(state) => setPlotForm({ ...plotForm, state })}
        />

        {/* Ordem Padronizada: LOTE primeiro, depois MATRÍCULA (Ambos Opcionais) */}
        <div>
          <Label htmlFor="plotLot">Lote (Opcional)</Label>
          <Input
            id="plotLot"
            value={plotForm.lot || ""}
            onChange={(e) => setPlotForm({ ...plotForm, lot: e.target.value })}
            placeholder="Ex: Lote 04"
          />
        </div>

        <div>
          <Label htmlFor="plotRegistration">Matrícula (Opcional)</Label>
          <Input
            id="plotRegistration"
            value={plotForm.registration || ""}
            onChange={(e) => setPlotForm({ ...plotForm, registration: e.target.value })}
            placeholder="Ex: 56.789"
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
          {editingPlot ? "Atualizar Talhão" : "Salvar Talhão"}
        </Button>
      </div>
    </form>
  );
};
`;

fs.writeFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/farms/FarmForm.tsx', farmFormCode, 'utf8');
fs.writeFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/farms/PlotForm.tsx', plotFormCode, 'utf8');
console.log('Successfully updated FarmForm.tsx and PlotForm.tsx with standard Lote -> Matricula, optional fields, and multi-error validation!');
