const fs = require('fs');

const code = `import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { Order } from "@/hooks/useOrders";
import { CustomerSelect } from "../farms/CustomerSelect";
import { FarmSelect } from "./FarmSelect";
import { PlotSelect } from "./PlotSelect";
import { ConferenciaServiceForm } from "./ConferenciaServiceForm";
import { FoliarServiceForm } from "./FoliarServiceForm";
import { CompactionServiceForm } from "./CompactionServiceForm";
import { DroneMappingServiceForm } from "./DroneMappingServiceForm";
import { ATVServiceForm } from "./ATVServiceForm";
import { SoilSamplingServiceForm } from "./SoilSamplingServiceForm";
import { DroneSprayingServiceForm } from "./DroneSprayingServiceForm";
import { EqualizaServiceForm } from "./EqualizaServiceForm";
import React, { useMemo } from "react";
import { useClients } from "@/hooks/useClients";
import { useFarms } from "@/hooks/useFarms";

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingOrder: Order | null;
  formData: Order;
  onInputChange: (field: keyof Order, value: string | { id: string; name: string; quantity: number }[]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const OrderForm = ({
  open,
  onOpenChange,
  editingOrder,
  formData,
  onInputChange,
  onSubmit,
  onCancel,
}: OrderFormProps) => {
  const [selectedPlot, setSelectedPlot] = React.useState<string>("todos");
  const [isConferenciaAllPlotsSelected, setIsConferenciaAllPlotsSelected] = React.useState<boolean>(false);
  const { clients } = useClients();
  const { farms } = useFarms();

  const availableFarms = useMemo(() => {
    if (!formData.clientId) return [];
    return farms.filter(farm => farm.clientId === formData.clientId);
  }, [farms, formData.clientId]);

  const availablePlots = useMemo(() => {
    if (!formData.farmId) return [];
    const selectedFarm = farms.find(farm => farm.id === formData.farmId);
    return selectedFarm ? selectedFarm.plots : [];
  }, [farms, formData.farmId]);

  // Sempre arredonda para exatamente 2 casas decimais
  const currentFarmTotalAlqueires = useMemo(() => {
    if (!formData.farmId) return 0;
    const selectedFarm = farms.find(farm => farm.id === formData.farmId);
    if (selectedFarm) {
      const totalAreaHectares = selectedFarm.plots.reduce((sum, p) => sum + (parseFloat(p.area || "0") || 0), 0);
      return Number((totalAreaHectares / 2.42).toFixed(2));
    }
    return 0;
  }, [farms, formData.farmId]);

  const calculatedAlqueires = useMemo(() => {
    const ha = parseFloat(formData.area || "0") || 0;
    return Number((ha / 2.42).toFixed(2));
  }, [formData.area]);

  // Serviços Oficiais validados da Planilha Agronômica
  const availableServices = [
    { id: "1", name: "Amostragem de Solo (AP)", valorAlqueire: "278.30", status: "Ativo" },
    { id: "2", name: "Conferência", valorAlqueire: "65.00", status: "Ativo" },
    { id: "3", name: "Coleta Foliar", valorAlqueire: "60.00", status: "Ativo" },
    { id: "4", name: "Compactação de Solo", valorAlqueire: "430.00", status: "Ativo" },
    { id: "5", name: "Voo de Drone (Mapeamento)", valorAlqueire: "50.00", status: "Ativo" },
    { id: "6", name: "Pulverização com Drone", valorAlqueire: "200.00", status: "Ativo" },
    { id: "7", name: "Aplicação ATV", valorAlqueire: "260.00", status: "Ativo" },
    { id: "8", name: "Sistema Equaliza", valorAlqueire: "671.65", status: "Ativo" },
  ];

  const availableProducts = [
    { id: "1", name: "Defensivo A", valorUn: "45.00" },
    { id: "2", name: "Sementes Milho", valorUn: "120.00" },
    { id: "3", name: "Fertilizante NPK", valorUn: "80.00" },
    { id: "4", name: "Herbicida", valorUn: "65.00" }
  ];

  const activeSpecializedService = useMemo(() => {
    const valid = [
      "Conferência",
      "Coleta Foliar",
      "Compactação de Solo",
      "Voo de Drone (Mapeamento)",
      "Aplicação ATV",
      "Amostragem de Solo (AP)",
      "Pulverização",
      "Pulverização com Drone",
      "Sistema Equaliza",
      "Equaliza"
    ];
    if (valid.includes(formData.type)) return formData.type;
    if (formData.type === "Serviço" && valid.includes(formData.serviceName)) return formData.serviceName;
    return null;
  }, [formData.type, formData.serviceName]);

  const handleValuesChange = (calculatedValue: number) => {
    const formatted = calculatedValue.toFixed(2);
    const currentVal = parseFloat(formData.value || "0") || 0;
    // Previne loops de re-renderização: só atualiza se houver diferença real >= 1 centavo
    if (Math.abs(currentVal - calculatedValue) >= 0.01) {
      onInputChange("value", formatted);
    }
  };

  const addProduct = () => {
    const newProducts = [...(formData.productsData || []), { id: "", name: "", quantity: 1 }];
    onInputChange("productsData", newProducts);
  };

  const removeProduct = (index: number) => {
    const newProducts = (formData.productsData || []).filter((_, i) => i !== index);
    onInputChange("productsData", newProducts);
  };

  const updateProduct = (index: number, field: string, value: string | number) => {
    const newProducts = [...(formData.productsData || [])];
    newProducts[index] = { ...newProducts[index], [field]: value };
    onInputChange("productsData", newProducts);
  };

  const handleCustomerChange = (id: string) => {
    onInputChange("clientId", id);
    onInputChange("farmId", "");
    setSelectedPlot("todos");
    onInputChange("area", "");
    setIsConferenciaAllPlotsSelected(false);
  };

  const handleFarmChange = (id: string) => {
    onInputChange("farmId", id);
    setSelectedPlot("todos");
    const selectedFarm = farms.find(farm => farm.id === id);
    if (selectedFarm) {
      const totalArea = selectedFarm.plots.reduce((sum, p) => sum + (parseFloat(p.area || "0") || 0), 0);
      onInputChange("area", totalArea.toFixed(2));
      setIsConferenciaAllPlotsSelected(true);
    } else {
      onInputChange("area", "");
      setIsConferenciaAllPlotsSelected(false);
    }
  };

  const handlePlotChange = (plotId: string) => {
    setSelectedPlot(plotId);
    const selectedFarm = farms.find(f => f.id === formData.farmId);
    if (!selectedFarm) return;

    if (plotId === "todos") {
      const totalArea = selectedFarm.plots.reduce((sum, p) => sum + (parseFloat(p.area || "0") || 0), 0);
      onInputChange("area", totalArea.toFixed(2));
      setIsConferenciaAllPlotsSelected(true);
    } else {
      const plot = selectedFarm.plots.find(p => p.id === plotId);
      const plotArea = plot ? (parseFloat(plot.area || "0") || 0).toFixed(2) : "";
      onInputChange("area", plotArea);
      setIsConferenciaAllPlotsSelected(false);
    }
  };

  const renderFieldsByType = () => {
    switch (formData.type) {
      case "Produto":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Produtos</Label>
              <Button type="button" size="sm" onClick={addProduct}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
            {(formData.productsData || []).map((product, index) => (
              <div key={index} className="grid grid-cols-4 gap-2 items-end">
                <div>
                  <Label>Produto</Label>
                  <Select 
                    value={product.id} 
                    onValueChange={(value) => {
                      const selectedProduct = availableProducts.find(p => p.id === value);
                      updateProduct(index, "id", value);
                      updateProduct(index, "name", selectedProduct?.name || "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - R$ {product.valorUn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quantidade</Label>
                  <Input
                    type="number" step="any"
                    min="1"
                    value={product.quantity}
                    onChange={(e) => updateProduct(index, "quantity", parseInt(e.target.value) || 1)}
                  />
                </div>
                <div></div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeProduct(index)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        );

      case "Serviço":
        return (
          <div>
            <Label htmlFor="service">Serviço</Label>
            <Select value={formData.serviceName} onValueChange={(value) => onInputChange("serviceName", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                {availableServices
                  .filter(service => service.status === "Ativo")
                  .map((service) => (
                    <SelectItem key={service.id} value={service.name}>
                      {service.name} - R$ {service.valorAlqueire}/alqueire
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingOrder ? "Editar Pedido" : "Novo Pedido"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="customer">Cliente</Label>
              <CustomerSelect
                value={formData.clientId}
                onValueChange={handleCustomerChange}
                customers={clients}
              />
            </div>
            <div>
              <Label htmlFor="farm">Fazenda</Label>
              <FarmSelect
                value={formData.farmId}
                onValueChange={handleFarmChange}
                farms={availableFarms}
                disabled={!formData.clientId}
              />
            </div>
            <div>
              <Label htmlFor="plot">Talhão</Label>
              <PlotSelect
                value={selectedPlot}
                onValueChange={handlePlotChange}
                plots={availablePlots}
                disabled={!formData.farmId}
              />
            </div>
          </div>

          {/* Resumo da Área Selecionada */}
          {formData.area && (
            <div className="flex gap-4 p-2.5 bg-muted/40 rounded-md border text-sm">
              <div>
                Área em Hectares: <strong>{parseFloat(formData.area).toFixed(2)} ha</strong>
              </div>
              <div className="border-l pl-4">
                Área em Alqueires: <strong>{calculatedAlqueires.toFixed(2)} alq</strong>
              </div>
            </div>
          )}
          
          <div>
            <Label htmlFor="type">Tipo do Pedido / Serviço</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => {
                onInputChange("type", value);
                if (value !== "Produto" && value !== "Serviço") {
                  onInputChange("serviceName", value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Amostragem de Solo (AP)">Amostragem de Solo (AP)</SelectItem>
                <SelectItem value="Conferência">Conferência de Amostragem</SelectItem>
                <SelectItem value="Voo de Drone (Mapeamento)">Voo de Drone (Mapeamento)</SelectItem>
                <SelectItem value="Pulverização com Drone">Pulverização com Drone</SelectItem>
                <SelectItem value="Compactação de Solo">Compactação de Solo</SelectItem>
                <SelectItem value="Coleta Foliar">Coleta Foliar</SelectItem>
                <SelectItem value="Aplicação ATV">Aplicação ATV (Sistematização)</SelectItem>
                <SelectItem value="Sistema Equaliza">Sistema Equaliza</SelectItem>
                <SelectItem value="Produto">Venda de Produto</SelectItem>
                <SelectItem value="Serviço">Outro Serviço Avulso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {renderFieldsByType()}
          
          {!activeSpecializedService && formData.type !== "Produto" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="area">Área (ha)</Label>
                <Input
                  id="area"
                  type="number"
                  step="0.01"
                  value={formData.area}
                  onChange={(e) => onInputChange("area", e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="value">Valor Total (R$)</Label>
                <Input
                  id="value"
                  value={formData.value}
                  onChange={(e) => onInputChange("value", e.target.value)}
                  placeholder="R$ 0,00"
                  required
                />
              </div>
            </div>
          )}

          {/* Subformulários Especializados da Planilha Agronômica com Estabilização */}
          {activeSpecializedService === "Conferência" && (
            <ConferenciaServiceForm
              initialAlqueires={calculatedAlqueires}
              initialNumAnalises={parseInt(formData.productsData?.[0]?.quantity?.toString() || "0")}
              totalFarmAlqueires={currentFarmTotalAlqueires}
              onValuesChange={handleValuesChange}
              onAllPlotsSelectedChange={setIsConferenciaAllPlotsSelected}
              onProductsChange={(products) => onInputChange("productsData", products)}
            />
          )}

          {activeSpecializedService === "Coleta Foliar" && (
            <FoliarServiceForm
              initialAlqueires={calculatedAlqueires}
              initialNumPontos={parseInt(formData.productsData?.[0]?.quantity?.toString() || "0")}
              totalFarmAlqueires={currentFarmTotalAlqueires}
              onValuesChange={handleValuesChange}
            />
          )}

          {activeSpecializedService === "Compactação de Solo" && (
            <CompactionServiceForm
              initialNumPontos={parseInt(formData.productsData?.[0]?.quantity?.toString() || "4")}
              onValuesChange={handleValuesChange}
            />
          )}

          {activeSpecializedService === "Voo de Drone (Mapeamento)" && (
            <DroneMappingServiceForm
              initialAlqueires={calculatedAlqueires}
              onValuesChange={handleValuesChange}
            />
          )}

          {activeSpecializedService === "Aplicação ATV" && (
            <ATVServiceForm
              initialAreaHa={parseFloat(formData.area) || 10}
              onValuesChange={handleValuesChange}
            />
          )}

          {activeSpecializedService === "Amostragem de Solo (AP)" && (
            <SoilSamplingServiceForm
              initialAlqueires={calculatedAlqueires}
              initialNumPontos={parseInt(formData.productsData?.[0]?.quantity?.toString() || "0")}
              onValuesChange={handleValuesChange}
              onAreaChange={(areaHa) => {
                const cur = parseFloat(formData.area || "0") || 0;
                if (Math.abs(cur - areaHa) > 0.05) {
                  onInputChange("area", areaHa.toFixed(2));
                }
              }}
              onProductsChange={(products) => onInputChange("productsData", products)}
            />
          )}

          {(activeSpecializedService === "Pulverização" || activeSpecializedService === "Pulverização com Drone") && (
            <DroneSprayingServiceForm
              initialAreaHa={parseFloat(formData.area) || 0}
              onValuesChange={handleValuesChange}
            />
          )}

          {(activeSpecializedService === "Sistema Equaliza" || activeSpecializedService === "Equaliza") && (
            <EqualizaServiceForm
              initialAlqueires={calculatedAlqueires}
              onValuesChange={handleValuesChange}
            />
          )}

          {/* Exibição Clara do Total Calculado */}
          {activeSpecializedService && (
            <div className="mt-4 p-3 bg-muted/30 border rounded-md">
              <Label htmlFor="final-value" className="text-sm font-semibold">Valor Total Calculado do Pedido</Label>
              <Input
                id="final-value"
                value={\`R$ \${parseFloat(formData.value || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`}
                readOnly
                className="bg-background font-bold text-lg text-primary mt-1"
              />
            </div>
          )}
          
          {editingOrder && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => onInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="payment">Pagamento</Label>
                <Select value={formData.payment} onValueChange={(value) => onInputChange("payment", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aguardando">Aguardando</SelectItem>
                    <SelectItem value="Parcial">Parcial</SelectItem>
                    <SelectItem value="Pago">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
              {editingOrder ? "Atualizar Pedido" : "Criar Pedido"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
`;

fs.writeFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/OrderForm.tsx', code, 'utf8');
console.log('Successfully updated OrderForm.tsx with numerical stabilization, 2 decimal places, and official services!');
