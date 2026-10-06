const fs = require('fs');

const code = `import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Edit,
  Plus,
  Trash2,
  Users,
  Wrench,
  CheckCircle2,
  Clock,
  X,
  ChevronRight,
  Search,
  DollarSign,
  FlaskConical,
  AlertTriangle,
  RotateCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";

interface CollaboratorOption {
  id: string;
  name: string;
  role?: string;
}

interface EquipmentOption {
  id: string;
  name: string;
  type?: string;
}

interface OperatorEquipmentSplit {
  id: string;
  collaboratorName: string;
  equipmentName: string;
  areaHa: number;
}

interface PartialExecution {
  id: string;
  date: string;
  executedArea: string;
  equipmentNames: string[];
  collaborators: string[];
  splits?: OperatorEquipmentSplit[];
  notes: string;
  status: string;
}

interface Execution {
  id: string;
  orderId?: string;
  clientName: string;
  clientId: string;
  farmName: string;
  farmId: string;
  city?: string;
  state?: string;
  serviceName: string;
  area: string;
  value?: string;
  numericValue?: number;
  scheduledDate: string;
  equipmentNames: string[];
  collaborators: string[];
  status: string;
  paymentStatus?: string;
  notes?: string;
  partialExecutions: PartialExecution[];
}

const statusOptions = ["Todos", "Pendente", "Agendado", "Em Andamento", "Concluído", "Cancelado"];

// Componente para seleção múltipla com chips / badges
interface MultiSelectChipsProps {
  label: string;
  icon?: React.ReactNode;
  availableOptions: { id: string; name: string; subtitle?: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

const MultiSelectChips: React.FC<MultiSelectChipsProps> = ({
  label,
  icon,
  availableOptions,
  selectedValues,
  onChange,
  placeholder = "Selecione..."
}) => {
  const [customInput, setCustomInput] = useState("");

  const toggleOption = (name: string) => {
    if (selectedValues.includes(name)) {
      onChange(selectedValues.filter(v => v !== name));
    } else {
      onChange([...selectedValues, name]);
    }
  };

  const addCustom = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const val = customInput.trim();
    if (val && !selectedValues.includes(val)) {
      onChange([...selectedValues, val]);
      setCustomInput("");
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5 text-xs font-semibold">
        {icon}
        {label}
      </Label>
      <div className="flex flex-wrap gap-1.5 p-2 bg-muted/40 border rounded-md min-h-[42px] items-center">
        {selectedValues.map((val) => (
          <Badge
            key={val}
            variant="secondary"
            className="flex items-center gap-1 text-xs py-0.5 px-2 bg-background border shadow-xs"
          >
            <span>{val}</span>
            <button
              type="button"
              onClick={() => toggleOption(val)}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {selectedValues.length === 0 && !customInput && (
          <span className="text-xs text-muted-foreground italic px-1">{placeholder}</span>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder={\`Digite outro(a) \${label.toLowerCase()} e aperte Enter...\`}
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={addCustom}
          className="text-xs h-8"
        />
        <Button type="button" size="sm" variant="outline" onClick={addCustom} className="h-8 text-xs">
          Adicionar
        </Button>
      </div>

      {availableOptions.length > 0 && (
        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 border rounded bg-background">
          {availableOptions.map((opt) => {
            const isSelected = selectedValues.includes(opt.name);
            return (
              <button
                type="button"
                key={opt.id}
                onClick={() => toggleOption(opt.name)}
                className={\`text-[11px] px-2 py-0.5 rounded border transition-colors \${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/30 hover:bg-muted text-foreground border-border"
                }\`}
              >
                {opt.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const SchedulePage = () => {
  const { toast } = useToast();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros Avançados
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClient, setFilterClient] = useState("all");
  const [filterFarm, setFilterFarm] = useState("all");
  const [filterService, setFilterService] = useState("all");
  const [filterCollaborator, setFilterCollaborator] = useState("all");
  const [filterEquipment, setFilterEquipment] = useState("all");
  const [filterState, setFilterState] = useState("all");
  const [filterCity, setFilterCity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [collaboratorsList, setCollaboratorsList] = useState<CollaboratorOption[]>([]);
  const [equipmentList, setEquipmentList] = useState<EquipmentOption[]>([]);

  // Modais
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isFinanceCompletionModalOpen, setIsFinanceCompletionModalOpen] = useState(false);
  const [isIncludeAnalysesModalOpen, setIsIncludeAnalysesModalOpen] = useState(false);

  // Form State: Nova Execução com Rateio
  const [partialExecutionForm, setPartialExecutionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    executedArea: "",
    equipmentNames: [] as string[],
    collaborators: [] as string[],
    notes: "",
  });

  const [executionSplits, setExecutionSplits] = useState<OperatorEquipmentSplit[]>([]);
  const [splitOperator, setSplitOperator] = useState("");
  const [splitEquipment, setSplitEquipment] = useState("");
  const [splitArea, setSplitArea] = useState("");

  // Form State: Conclusão Financeira
  const [financeCompletionForm, setFinanceCompletionForm] = useState({
    isPartial: false,
    executedPercentage: 100,
    originalValue: 0,
    suggestedValue: 0,
    finalValue: "",
    adjustmentNote: "",
  });

  // Form State: Incluir Análises Recomendadas
  const [recommendedAnalysesList, setRecommendedAnalysesList] = useState<Array<{
    type: string;
    suggestedQty: number;
    currentQty: number;
    unitPrice: number;
    isModified: boolean;
  }>>([]);

  // Form State: Agendamento Geral
  const [scheduleForm, setScheduleForm] = useState({
    scheduledDate: "",
    collaborators: [] as string[],
    equipmentNames: [] as string[],
    status: "Agendado",
    notes: ""
  });

  useEffect(() => {
    fetchExecutions();
    fetchEquipment();
    fetchCollaborators();
  }, []);

  const fetchCollaborators = async () => {
    try {
      const data = await api.get<any[]>('/collaborators');
      if (Array.isArray(data)) {
        setCollaboratorsList(data.map(c => ({
          id: c.id,
          name: c.name || "Colaborador",
          role: c.role || "Operador"
        })));
      }
    } catch {
      setCollaboratorsList([
        { id: "1", name: "Almir", role: "Operador de Trator / ATV" },
        { id: "2", name: "Maicon", role: "Piloto de Drone" },
        { id: "3", name: "Carlos", role: "Técnico Amostrador" }
      ]);
    }
  };

  const fetchEquipment = async () => {
    try {
      const data = await api.get<any[]>('/equipment');
      if (Array.isArray(data)) {
        setEquipmentList(data.map(e => ({
          id: e.id,
          name: e.name || "Equipamento",
          type: e.type || "Máquina"
        })));
      }
    } catch {
      setEquipmentList([
        { id: "1", name: "Quadriciclo ATV 01", type: "Veículo" },
        { id: "2", name: "Quadriciclo ATV 02", type: "Veículo" },
        { id: "3", name: "Drone DJI Agras T40", type: "Drone" },
        { id: "4", name: "Trator Valtra A950", type: "Veículo" }
      ]);
    }
  };

  const fetchExecutions = async () => {
    try {
      setLoading(true);
      const orders = await api.get<any[]>('/orders');
      if (Array.isArray(orders)) {
        const mapped: Execution[] = orders.map(o => {
          const rawSchedules = Array.isArray(o.schedules) ? o.schedules : [];
          const rawExecutions = Array.isArray(o.executions) ? o.executions : [];
          const latestSchedule = rawSchedules[rawSchedules.length - 1];

          return {
            id: o.id,
            orderId: o.id,
            clientName: o.client?.name || o.client_name || "Cliente",
            clientId: o.client_id || "",
            farmName: o.farm?.name || o.farm_name || "Fazenda",
            farmId: o.farm_id || "",
            city: o.farm?.city || o.city || "-",
            state: o.farm?.state || o.state || "-",
            serviceName: o.service_name || o.service || o.type || "Serviço Geral",
            area: (o.area !== null && o.area !== undefined) ? String(o.area) : "0",
            value: o.value ? String(o.value) : "0",
            numericValue: typeof o.value === 'number' ? o.value : (parseFloat(String(o.value || "0").replace(/[^0-9.]/g, '')) || 0),
            scheduledDate: latestSchedule?.date || latestSchedule?.scheduledDate || (o.created_at ? o.created_at.split('T')[0] : ""),
            equipmentNames: Array.isArray(latestSchedule?.equipmentNames) ? latestSchedule.equipmentNames : (latestSchedule?.equipmentName ? [latestSchedule.equipmentName] : []),
            collaborators: Array.isArray(latestSchedule?.collaborators) ? latestSchedule.collaborators : (latestSchedule?.collaboratorName ? [latestSchedule.collaboratorName] : []),
            status: o.status || "Pendente",
            paymentStatus: o.payment || "Aguardando",
            notes: latestSchedule?.notes || latestSchedule?.description || "",
            partialExecutions: rawExecutions.map(e => ({
              id: e.id || String(Date.now()),
              date: e.date || new Date().toISOString().split('T')[0],
              executedArea: String(e.areaExecuted || e.hectares || e.executedArea || "0"),
              equipmentNames: Array.isArray(e.equipmentNames) ? e.equipmentNames : (e.equipmentName ? [e.equipmentName] : []),
              collaborators: Array.isArray(e.collaborators) ? e.collaborators : (e.collaboratorName ? [e.collaboratorName] : []),
              splits: Array.isArray(e.splits) ? e.splits : [],
              notes: e.notes || "",
              status: e.status || "Concluída"
            }))
          };
        });
        setExecutions(mapped);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar agenda",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Listas únicas para filtros
  const uniqueClients = useMemo(() => Array.from(new Set(executions.map(e => e.clientName))).filter(Boolean), [executions]);
  const uniqueFarms = useMemo(() => Array.from(new Set(executions.map(e => e.farmName))).filter(Boolean), [executions]);
  const uniqueServices = useMemo(() => Array.from(new Set(executions.map(e => e.serviceName))).filter(Boolean), [executions]);
  const uniqueStates = useMemo(() => Array.from(new Set(executions.map(e => e.state))).filter(s => s && s !== "-"), [executions]);
  const uniqueCities = useMemo(() => Array.from(new Set(executions.map(e => e.city))).filter(c => c && c !== "-"), [executions]);

  // Filtragem combinada
  const filteredExecutions = useMemo(() => {
    return executions.filter(e => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesQuery =
          e.clientName.toLowerCase().includes(q) ||
          e.farmName.toLowerCase().includes(q) ||
          e.serviceName.toLowerCase().includes(q) ||
          (e.city && e.city.toLowerCase().includes(q)) ||
          (e.state && e.state.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      if (filterClient !== "all" && e.clientName !== filterClient) return false;
      if (filterFarm !== "all" && e.farmName !== filterFarm) return false;
      if (filterService !== "all" && e.serviceName !== filterService) return false;
      if (filterState !== "all" && e.state !== filterState) return false;
      if (filterCity !== "all" && e.city !== filterCity) return false;
      if (filterStatus !== "all" && e.status !== filterStatus) return false;

      if (filterCollaborator !== "all" && !e.collaborators.includes(filterCollaborator)) return false;
      if (filterEquipment !== "all" && !e.equipmentNames.includes(filterEquipment)) return false;

      return true;
    });
  }, [executions, searchTerm, filterClient, filterFarm, filterService, filterCollaborator, filterEquipment, filterState, filterCity, filterStatus]);

  // Abrir Modal de Nova Execução com preenchimento automático do saldo restante
  const openExecutionModal = (execution: Execution) => {
    setSelectedExecution(execution);
    const totalArea = parseFloat(execution.area || "0");
    const alreadyDone = execution.partialExecutions.reduce((sum, p) => sum + (parseFloat(p.executedArea) || 0), 0);
    const remaining = Math.max(0, totalArea - alreadyDone);

    setPartialExecutionForm({
      date: new Date().toISOString().split('T')[0],
      executedArea: remaining > 0 ? remaining.toFixed(2) : "",
      equipmentNames: [...execution.equipmentNames],
      collaborators: [...execution.collaborators],
      notes: ""
    });
    setExecutionSplits([]);
    setSplitOperator(execution.collaborators[0] || "");
    setSplitEquipment(execution.equipmentNames[0] || "");
    setSplitArea("");
    setIsExecutionModalOpen(true);
  };

  // Adicionar linha de rateio (Operador + Máquina = Área ha)
  const handleAddSplit = () => {
    const areaNum = parseFloat(splitArea);
    if (!splitOperator || !splitEquipment || isNaN(areaNum) || areaNum <= 0) {
      toast({
        title: "Dados incompletos no rateio",
        description: "Selecione o operador, equipamento e informe a área em hectares.",
        variant: "destructive"
      });
      return;
    }

    const newSplit: OperatorEquipmentSplit = {
      id: Date.now().toString(),
      collaboratorName: splitOperator,
      equipmentName: splitEquipment,
      areaHa: areaNum
    };

    const updatedSplits = [...executionSplits, newSplit];
    setExecutionSplits(updatedSplits);

    // Soma automaticamente a área dos rateios
    const totalSplitArea = updatedSplits.reduce((sum, s) => sum + s.areaHa, 0);
    setPartialExecutionForm(prev => ({
      ...prev,
      executedArea: totalSplitArea.toFixed(2),
      collaborators: Array.from(new Set([...prev.collaborators, splitOperator])),
      equipmentNames: Array.from(new Set([...prev.equipmentNames, splitEquipment]))
    }));

    setSplitArea("");
  };

  const handleRemoveSplit = (splitId: string) => {
    const updated = executionSplits.filter(s => s.id !== splitId);
    setExecutionSplits(updated);
    if (updated.length > 0) {
      const sum = updated.reduce((acc, s) => acc + s.areaHa, 0);
      setPartialExecutionForm(prev => ({ ...prev, executedArea: sum.toFixed(2) }));
    }
  };

  // Salvar Apontamento de Execução Parcial ou Total
  const handleAddPartialExecution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExecution) return;

    const areaNum = parseFloat(partialExecutionForm.executedArea);
    if (isNaN(areaNum) || areaNum <= 0) {
      toast({ title: "Área inválida", description: "Informe uma área válida maior que 0.", variant: "destructive" });
      return;
    }

    try {
      const newPartial: PartialExecution = {
        id: Date.now().toString(),
        date: partialExecutionForm.date,
        executedArea: partialExecutionForm.executedArea,
        equipmentNames: partialExecutionForm.equipmentNames,
        collaborators: partialExecutionForm.collaborators,
        splits: executionSplits.length > 0 ? executionSplits : undefined,
        notes: partialExecutionForm.notes,
        status: "Concluída"
      };

      const updatedPartials = [...selectedExecution.partialExecutions, newPartial];
      const totalExec = updatedPartials.reduce((sum, p) => sum + parseFloat(p.executedArea || "0"), 0);

      // IMPORTANTE: 100% de execução física NÃO conclui o financeiro automaticamente! Mantém 'Em Andamento' até conclusão formal
      const updatedStatus = "Em Andamento";

      await api.put(\`/orders/\${selectedExecution.id}\`, {
        executed_area: totalExec,
        status: updatedStatus,
        executions: updatedPartials.map(p => ({
          id: p.id,
          date: p.date,
          hectares: parseFloat(p.executedArea),
          areaExecuted: parseFloat(p.executedArea),
          equipmentNames: p.equipmentNames,
          collaborators: p.collaborators,
          splits: p.splits,
          notes: p.notes,
          status: p.status
        }))
      });

      toast({
        title: "Apontamento registrado!",
        description: \`Registrado \${areaNum.toFixed(2)} ha com sucesso. Total executado: \${totalExec.toFixed(2)} ha.\`
      });

      setIsExecutionModalOpen(false);
      fetchExecutions();
    } catch (err: any) {
      toast({ title: "Erro ao salvar execução", description: err.message, variant: "destructive" });
    }
  };

  // Modal de Conclusão Financeira (Total ou Parcial)
  const openFinanceCompletionModal = (execution: Execution) => {
    setSelectedExecution(execution);
    const totalArea = parseFloat(execution.area || "0");
    const totalExec = execution.partialExecutions.reduce((sum, p) => sum + (parseFloat(p.executedArea) || 0), 0);
    const isPartial = totalExec < totalArea;
    const ratio = totalArea > 0 ? (totalExec / totalArea) : 1;
    const origVal = execution.numericValue || 0;
    const suggested = isPartial ? Number((origVal * ratio).toFixed(2)) : origVal;

    setFinanceCompletionForm({
      isPartial,
      executedPercentage: totalArea > 0 ? Math.min(100, Math.round(ratio * 100)) : 100,
      originalValue: origVal,
      suggestedValue: suggested,
      finalValue: suggested.toFixed(2),
      adjustmentNote: isPartial ? \`Execução parcial aprovada com \${totalExec.toFixed(2)} de \${totalArea.toFixed(2)} ha contratados.\` : ""
    });

    setIsFinanceCompletionModalOpen(true);
  };

  const handleConfirmFinanceCompletion = async () => {
    if (!selectedExecution) return;
    const finalValNum = parseFloat(financeCompletionForm.finalValue);
    if (isNaN(finalValNum) || finalValNum < 0) {
      toast({ title: "Valor financeiro inválido", variant: "destructive" });
      return;
    }

    try {
      await api.put(\`/orders/\${selectedExecution.id}\`, {
        status: "Concluído",
        payment: "Aguardando",
        value: finalValNum,
        financial_notes: financeCompletionForm.adjustmentNote
      });

      toast({
        title: "Serviço Concluído e Enviado ao Financeiro!",
        description: \`Valor de R$ \${finalValNum.toFixed(2)} registrado para faturamento.\`
      });

      setIsFinanceCompletionModalOpen(false);
      fetchExecutions();
    } catch (err: any) {
      toast({ title: "Erro ao concluir serviço", description: err.message, variant: "destructive" });
    }
  };

  // Modal de Inclusão de Análises Recomendadas da Planilha
  const openIncludeAnalysesModal = (execution: Execution) => {
    setSelectedExecution(execution);
    const areaHa = parseFloat(execution.area || "0") || 0;
    const service = execution.serviceName || "";

    const list: Array<{
      type: string;
      suggestedQty: number;
      currentQty: number;
      unitPrice: number;
      isModified: boolean;
    }> = [];

    if (service.includes("Solo") || service.includes("AP")) {
      const calculatedPoints = Math.max(1, Math.floor(areaHa / 2.95) || 10);
      list.push({
        type: "MACRO",
        suggestedQty: calculatedPoints,
        currentQty: calculatedPoints,
        unitPrice: 52.30,
        isModified: false
      });
      list.push({
        type: "ANÁLISE 20-40 CM",
        suggestedQty: Math.max(1, Math.floor(calculatedPoints * 0.1)),
        currentQty: Math.max(1, Math.floor(calculatedPoints * 0.1)),
        unitPrice: 70.00,
        isModified: false
      });
    } else if (service.includes("Conferência")) {
      list.push({
        type: "MACRO",
        suggestedQty: 10,
        currentQty: 10,
        unitPrice: 52.30,
        isModified: false
      });
      list.push({
        type: "ANÁLISE 20-40 CM",
        suggestedQty: 1,
        currentQty: 1,
        unitPrice: 70.00,
        isModified: false
      });
    } else if (service.includes("Foliar")) {
      const leafPoints = Math.max(1, Math.round(areaHa / 10) || 5);
      list.push({
        type: "ANÁLISE DE FOLIAR",
        suggestedQty: leafPoints,
        currentQty: leafPoints,
        unitPrice: 60.00,
        isModified: false
      });
    } else {
      list.push({
        type: "MACRO",
        suggestedQty: 5,
        currentQty: 5,
        unitPrice: 52.30,
        isModified: false
      });
    }

    setRecommendedAnalysesList(list);
    setIsIncludeAnalysesModalOpen(true);
  };

  const handleConfirmIncludeAnalyses = async () => {
    if (!selectedExecution) return;
    try {
      for (const item of recommendedAnalysesList) {
        if (item.currentQty <= 0) continue;
        await api.post('/analyses', {
          type: item.type,
          farm_id: selectedExecution.farmId || null,
          status: "Pendente",
          date: new Date().toISOString().split('T')[0],
          results: {
            serviceName: selectedExecution.serviceName,
            clientName: selectedExecution.clientName,
            quantity: item.currentQty,
            suggestedQuantity: item.suggestedQty,
            isModified: item.isModified,
            financialTag: item.isModified ? "Quantidade Alterada (Comercial)" : "Conforme Orçamento"
          }
        });
      }

      toast({
        title: "Análises Cadastradas no Laboratório!",
        description: "As análises recomendadas foram incluídas com sucesso na tabela de análises."
      });

      setIsIncludeAnalysesModalOpen(false);
    } catch (err: any) {
      toast({ title: "Erro ao incluir análises", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Agenda de Serviços Agrícolas</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe o agendamento, progresso de execução por operador e fechamento financeiro
          </p>
        </div>
      </div>

      {/* Painel de Filtros Avançados */}
      <Card className="p-4 bg-muted/20 border">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <div className="col-span-1 sm:col-span-2">
            <Label className="text-xs font-semibold">Busca Geral</Label>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente, fazenda, cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-xs bg-background h-9"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Cliente</Label>
            <Select value={filterClient} onValueChange={setFilterClient}>
              <SelectTrigger className="mt-1 text-xs bg-background h-9">
                <SelectValue placeholder="Todos os clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {uniqueClients.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold">Fazenda</Label>
            <Select value={filterFarm} onValueChange={setFilterFarm}>
              <SelectTrigger className="mt-1 text-xs bg-background h-9">
                <SelectValue placeholder="Todas as fazendas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as fazendas</SelectItem>
                {uniqueFarms.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold">Serviço</Label>
            <Select value={filterService} onValueChange={setFilterService}>
              <SelectTrigger className="mt-1 text-xs bg-background h-9">
                <SelectValue placeholder="Todos os serviços" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os serviços</SelectItem>
                {uniqueServices.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold">Operador</Label>
            <Select value={filterCollaborator} onValueChange={setFilterCollaborator}>
              <SelectTrigger className="mt-1 text-xs bg-background h-9">
                <SelectValue placeholder="Todos os operadores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os operadores</SelectItem>
                {collaboratorsList.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold">Equipamento</Label>
            <Select value={filterEquipment} onValueChange={setFilterEquipment}>
              <SelectTrigger className="mt-1 text-xs bg-background h-9">
                <SelectValue placeholder="Todos os equipamentos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os equipamentos</SelectItem>
                {equipmentList.map(eq => <SelectItem key={eq.id} value={eq.name}>{eq.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold">Estado (UF)</Label>
            <Select value={filterState} onValueChange={setFilterState}>
              <SelectTrigger className="mt-1 text-xs bg-background h-9">
                <SelectValue placeholder="Todos os estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                {uniqueStates.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold">Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="mt-1 text-xs bg-background h-9">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(st => <SelectItem key={st} value={st === "Todos" ? "all" : st}>{st}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setFilterClient("all");
                setFilterFarm("all");
                setFilterService("all");
                setFilterCollaborator("all");
                setFilterEquipment("all");
                setFilterState("all");
                setFilterCity("all");
                setFilterStatus("all");
              }}
              className="w-full text-xs h-9 flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Limpar Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabela Principal */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente / Fazenda</TableHead>
                  <TableHead>Cidade / UF</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Área Total</TableHead>
                  <TableHead>Progresso da Execução</TableHead>
                  <TableHead>Data Agendada</TableHead>
                  <TableHead>Equipe</TableHead>
                  <TableHead>Equipamentos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExecutions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Nenhum agendamento encontrado com os filtros selecionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExecutions.map((execution) => {
                    const totalArea = parseFloat(execution.area) || 0;
                    const executedArea = (execution.partialExecutions || []).reduce(
                      (sum, p) => sum + (parseFloat(p.executedArea) || 0),
                      0
                    );
                    const percent = totalArea > 0 ? Math.min(100, Math.round((executedArea / totalArea) * 100)) : 0;
                    const remainingArea = Math.max(0, totalArea - executedArea);

                    return (
                      <TableRow key={execution.id} className="hover:bg-muted/40">
                        <TableCell>
                          <div className="font-semibold text-foreground text-sm">{execution.clientName}</div>
                          <div className="text-xs text-muted-foreground">{execution.farmName}</div>
                        </TableCell>

                        <TableCell className="text-xs">
                          <span className="font-medium">{execution.city || "-"}</span>
                          {execution.state && execution.state !== "-" && (
                            <span className="text-muted-foreground ml-1">/ {execution.state}</span>
                          )}
                        </TableCell>

                        <TableCell className="font-medium text-xs">
                          {execution.serviceName}
                        </TableCell>

                        <TableCell className="text-xs font-semibold">
                          {totalArea.toFixed(2)} ha
                        </TableCell>

                        {/* Coluna de Progresso em Hectares */}
                        <TableCell>
                          <div className="space-y-1 min-w-[130px]">
                            <div className="flex justify-between text-xs font-medium">
                              <span>{executedArea.toFixed(2)} / {totalArea.toFixed(2)} ha</span>
                              <span className="font-bold text-primary">{percent}%</span>
                            </div>
                            <Progress value={percent} className="h-1.5" />
                            <div className="text-[10px] text-muted-foreground">
                              {remainingArea > 0 ? \`Faltam \${remainingArea.toFixed(2)} ha\` : "100% concluído"}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs">
                          {execution.scheduledDate ? (
                            <span className="flex items-center gap-1 font-medium">
                              <Clock className="h-3.5 w-3.5 text-primary" />
                              {new Date(execution.scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">Não definida</span>
                          )}
                        </TableCell>

                        {/* Equipe com Limite de 2 + Badge (+X) */}
                        <TableCell>
                          {execution.collaborators && execution.collaborators.length > 0 ? (
                            <div className="flex flex-wrap gap-1 items-center">
                              {execution.collaborators.slice(0, 2).map((collab, idx) => (
                                <Badge key={idx} variant="secondary" className="text-[11px] font-normal py-0 px-1.5">
                                  {collab}
                                </Badge>
                              ))}
                              {execution.collaborators.length > 2 && (
                                <Badge
                                  variant="outline"
                                  className="text-[11px] font-semibold py-0 px-1.5 cursor-help bg-muted/60"
                                  title={execution.collaborators.slice(2).join(', ')}
                                >
                                  +{execution.collaborators.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Não atribuído</span>
                          )}
                        </TableCell>

                        {/* Equipamentos com Limite de 2 + Badge (+X) */}
                        <TableCell>
                          {execution.equipmentNames && execution.equipmentNames.length > 0 ? (
                            <div className="flex flex-wrap gap-1 items-center">
                              {execution.equipmentNames.slice(0, 2).map((eq, idx) => (
                                <Badge key={idx} variant="outline" className="text-[11px] font-normal py-0 px-1.5">
                                  {eq}
                                </Badge>
                              ))}
                              {execution.equipmentNames.length > 2 && (
                                <Badge
                                  variant="outline"
                                  className="text-[11px] font-semibold py-0 px-1.5 cursor-help bg-muted/60"
                                  title={execution.equipmentNames.slice(2).join(', ')}
                                >
                                  +{execution.equipmentNames.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Não atribuído</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={\`text-xs \${
                              execution.status === "Concluído"
                                ? "bg-green-100 text-green-800"
                                : execution.status === "Em Andamento"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }\`}
                          >
                            {execution.status}
                          </Badge>
                        </TableCell>

                        {/* Ações da Agenda */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Incluir Análises Recomendadas */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                              onClick={() => openIncludeAnalysesModal(execution)}
                              title="Importar análises recomendadas da planilha"
                            >
                              <FlaskConical className="h-3.5 w-3.5 mr-1" />
                              Análises
                            </Button>

                            {/* Registrar Execução em Campo */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs font-medium"
                              onClick={() => openExecutionModal(execution)}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                              Execução
                            </Button>

                            {/* Concluir e Enviar para Financeiro */}
                            {execution.status !== "Concluído" && (
                              <Button
                                size="sm"
                                className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => openFinanceCompletionModal(execution)}
                                title="Concluir serviço e enviar ao financeiro"
                              >
                                <DollarSign className="h-3.5 w-3.5 mr-1" />
                                Concluir
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL 1: REGISTRO DE EXECUÇÃO COM RATEIO POR OPERADOR/MÁQUINA */}
      <Dialog open={isExecutionModalOpen} onOpenChange={setIsExecutionModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Apontamento de Campo — {selectedExecution?.clientName}
            </DialogTitle>
          </DialogHeader>

          {selectedExecution && (() => {
            const totalArea = parseFloat(selectedExecution.area || "0");
            const alreadyDone = selectedExecution.partialExecutions.reduce(
              (sum, p) => sum + (parseFloat(p.executedArea) || 0),
              0
            );
            const remaining = Math.max(0, totalArea - alreadyDone);

            return (
              <form onSubmit={handleAddPartialExecution} className="space-y-4">
                {/* Cards com Balanço da Área */}
                <div className="grid grid-cols-3 gap-3 p-3 bg-muted/40 rounded-lg border text-center">
                  <div>
                    <div className="text-xs text-muted-foreground">Área Contratada</div>
                    <div className="text-base font-bold text-foreground">{totalArea.toFixed(2)} ha</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Já Executado</div>
                    <div className="text-base font-bold text-emerald-600">{alreadyDone.toFixed(2)} ha</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Saldo Restante</div>
                    <div className="text-base font-bold text-amber-600">{remaining.toFixed(2)} ha</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="exec-date" className="text-xs font-semibold">Data da Operação</Label>
                    <Input
                      id="exec-date"
                      type="date"
                      value={partialExecutionForm.date}
                      onChange={(e) => setPartialExecutionForm({ ...partialExecutionForm, date: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center">
                      <Label htmlFor="exec-area" className="text-xs font-semibold">Área Executada Neste Apontamento (ha)</Label>
                      {remaining > 0 && (
                        <button
                          type="button"
                          onClick={() => setPartialExecutionForm(prev => ({ ...prev, executedArea: remaining.toFixed(2) }))}
                          className="text-[11px] text-primary hover:underline font-medium"
                        >
                          Usar saldo restante ({remaining.toFixed(2)} ha)
                        </button>
                      )}
                    </div>
                    <Input
                      id="exec-area"
                      type="number"
                      step="0.01"
                      value={partialExecutionForm.executedArea}
                      onChange={(e) => setPartialExecutionForm({ ...partialExecutionForm, executedArea: e.target.value })}
                      placeholder="0.00"
                      required
                      className="mt-1 text-base font-semibold"
                    />
                  </div>
                </div>

                {/* RATEIO POR OPERADOR E EQUIPAMENTO */}
                <div className="p-3 border rounded-md bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground">
                      Rateio por Operador e Equipamento (Quem executou o quê?)
                    </Label>
                    <span className="text-[11px] text-muted-foreground">Opcional, porém recomendado para relatórios</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                    <div>
                      <Label className="text-[11px]">Operador</Label>
                      <Select value={splitOperator} onValueChange={setSplitOperator}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {collaboratorsList.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-[11px]">Equipamento / Máquina</Label>
                      <Select value={splitEquipment} onValueChange={setSplitEquipment}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {equipmentList.map(eq => <SelectItem key={eq.id} value={eq.name}>{eq.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-1.5">
                      <div className="flex-1">
                        <Label className="text-[11px]">Área (ha)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Ex: 20"
                          value={splitArea}
                          onChange={(e) => setSplitArea(e.target.value)}
                          className="h-8 text-xs bg-background"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddSplit}
                        className="h-8 text-xs mt-auto bg-primary"
                      >
                        + Adicionar
                      </Button>
                    </div>
                  </div>

                  {executionSplits.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t">
                      <div className="text-[11px] font-semibold text-muted-foreground">Linhas de Rateio Adicionadas:</div>
                      {executionSplits.map((sp) => (
                        <div key={sp.id} className="flex items-center justify-between p-2 bg-background border rounded text-xs">
                          <div>
                            <strong>{sp.collaboratorName}</strong> operando <strong>{sp.equipmentName}</strong>:{" "}
                            <span className="font-semibold text-emerald-600">{sp.areaHa.toFixed(2)} ha</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSplit(sp.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="exec-notes" className="text-xs font-semibold">Observações de Campo</Label>
                  <Input
                    id="exec-notes"
                    placeholder="Ex: Condições do solo, clima, umidade..."
                    value={partialExecutionForm.notes}
                    onChange={(e) => setPartialExecutionForm({ ...partialExecutionForm, notes: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <DialogFooter className="pt-2 border-t flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsExecutionModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Registrar Execução
                  </Button>
                </DialogFooter>
              </form>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* MODAL 2: CONCLUSÃO FINANCEIRA (TOTAL OU PARCIAL COM AJUSTE DE VALOR) */}
      <Dialog open={isFinanceCompletionModalOpen} onOpenChange={setIsFinanceCompletionModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Concluir Serviço e Faturar
            </DialogTitle>
          </DialogHeader>

          {selectedExecution && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/40 rounded-lg border text-sm space-y-1">
                <div>Cliente: <strong>{selectedExecution.clientName}</strong></div>
                <div>Fazenda: <strong>{selectedExecution.farmName}</strong></div>
                <div>Serviço: <strong>{selectedExecution.serviceName}</strong></div>
                <div className="pt-2 border-t flex justify-between items-center text-xs">
                  <span>Execução Física Concluída:</span>
                  <Badge variant={financeCompletionForm.isPartial ? "secondary" : "default"}>
                    {financeCompletionForm.executedPercentage}% ({financeCompletionForm.isPartial ? "Parcial" : "Total 100%"})
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Valor Original Contratado</Label>
                <Input
                  value={\`R$ \${financeCompletionForm.originalValue.toFixed(2)}\`}
                  readOnly
                  className="bg-muted mt-1 font-medium"
                />
              </div>

              <div>
                <Label htmlFor="final-billing-value" className="text-xs font-semibold flex items-center justify-between">
                  <span>Valor Final a Faturar (R$)</span>
                  {financeCompletionForm.isPartial && (
                    <span className="text-[11px] text-amber-600">Sugerido proporcional ao executado</span>
                  )}
                </Label>
                <Input
                  id="final-billing-value"
                  type="number"
                  step="0.01"
                  value={financeCompletionForm.finalValue}
                  onChange={(e) => setFinanceCompletionForm({ ...financeCompletionForm, finalValue: e.target.value })}
                  className="mt-1 text-base font-bold text-emerald-600"
                />
              </div>

              <div>
                <Label htmlFor="adjustment-note" className="text-xs font-semibold">
                  Justificativa / Nota de Fechamento {financeCompletionForm.isPartial && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="adjustment-note"
                  placeholder="Ex: Conclusão parcial autorizada pelo cliente..."
                  value={financeCompletionForm.adjustmentNote}
                  onChange={(e) => setFinanceCompletionForm({ ...financeCompletionForm, adjustmentNote: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>

              <DialogFooter className="pt-2 border-t flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsFinanceCompletionModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmFinanceCompletion} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Enviar para Financeiro
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 3: INCLUIR ANÁLISES RECOMENDADAS DA PLANILHA */}
      <Dialog open={isIncludeAnalysesModalOpen} onOpenChange={setIsIncludeAnalysesModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-indigo-600" />
              Importar Análises do Serviço
            </DialogTitle>
          </DialogHeader>

          {selectedExecution && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Com base no serviço <strong>{selectedExecution.serviceName}</strong> ({selectedExecution.area} ha),
                as seguintes quantidades foram recomendadas pelo gabarito agronômico:
              </p>

              <div className="space-y-2 border rounded-md p-2 bg-muted/20">
                {recommendedAnalysesList.map((item, idx) => (
                  <div key={item.type} className="flex items-center justify-between p-2.5 bg-background border rounded">
                    <div>
                      <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                        {item.type}
                        {item.isModified && (
                          <Badge variant="destructive" className="text-[10px] py-0 px-1">
                            Qtd Alterada
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Sugerido: {item.suggestedQty} amostras (R$ {item.unitPrice.toFixed(2)}/un)
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Qtd:</Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.currentQty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setRecommendedAnalysesList(prev => {
                            const updated = [...prev];
                            updated[idx] = {
                              ...updated[idx],
                              currentQty: val,
                              isModified: val !== item.suggestedQty
                            };
                            return updated;
                          });
                        }}
                        className="w-20 text-center font-bold text-xs h-8"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                Caso as quantidades sejam alteradas, uma etiqueta de alerta será enviada ao setor financeiro e laboratório.
              </div>

              <DialogFooter className="pt-2 border-t flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsIncludeAnalysesModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmIncludeAnalyses} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Confirmar e Cadastrar Análises
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchedulePage;
`;

fs.writeFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/SchedulePage.tsx', code, 'utf8');
console.log('Successfully updated SchedulePage.tsx with comprehensive filters, collaborator splits, +X badges, progress tracking, and finance completion!');
