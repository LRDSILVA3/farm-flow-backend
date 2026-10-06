const fs = require('fs');
const path = require('path');

const frontendRoot = 'C:/Users/User/Documents/Projects/farm-flow-frontend';

const schedulePageCode = `import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Edit, Plus, Trash2, Users, Wrench, CheckCircle2, Clock, X, ChevronRight } from "lucide-react";
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

interface Execution {
  id: string;
  clientName: string;
  clientId: string;
  farmName: string;
  farmId: string;
  serviceName: string;
  area: string;
  scheduledDate: string;
  equipmentNames: string[];
  collaborators: string[];
  status: string;
  notes?: string;
  partialExecutions: PartialExecution[];
}

interface PartialExecution {
  id: string;
  date: string;
  executedArea: string;
  equipmentNames: string[];
  collaborators: string[];
  notes: string;
  status: string;
}

const statusOptions = ["Todos", "Pendente", "Agendado", "Em Andamento", "Concluído"];

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

  const removeValue = (name: string) => {
    onChange(selectedValues.filter(v => v !== name));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold flex items-center gap-1.5">
          {icon}
          {label} ({selectedValues.length} selecionado{selectedValues.length !== 1 ? 's' : ''})
        </Label>
      </div>

      {/* Selected tags */}
      <div className="flex flex-wrap gap-1.5 p-2 min-h-[38px] border rounded-md bg-muted/20">
        {selectedValues.length === 0 ? (
          <span className="text-xs text-muted-foreground self-center italic">
            Nenhum selecionado ainda
          </span>
        ) : (
          selectedValues.map(val => (
            <Badge
              key={val}
              variant="secondary"
              className="flex items-center gap-1 py-1 px-2 text-xs font-medium bg-background border shadow-xs"
            >
              <span>{val}</span>
              <button
                type="button"
                onClick={() => removeValue(val)}
                className="hover:text-destructive p-0.5 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>

      {/* Quick Select from Registered List */}
      {availableOptions.length > 0 && (
        <div className="space-y-1">
          <span className="text-[11px] text-muted-foreground font-medium block">
            Clique para adicionar/remover da lista cadastrada:
          </span>
          <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-1.5 border rounded-md bg-card">
            {availableOptions.map(opt => {
              const isSelected = selectedValues.includes(opt.name);
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => toggleOption(opt.name)}
                  className={\`text-xs px-2 py-1 rounded transition-colors text-left flex items-center gap-1 border \${
                    isSelected
                      ? 'bg-primary/10 border-primary text-primary font-medium'
                      : 'bg-muted/40 hover:bg-muted text-muted-foreground border-transparent'
                  }\`}
                >
                  <span className={\`w-1.5 h-1.5 rounded-full \${isSelected ? 'bg-primary' : 'bg-muted-foreground/40'}\`} />
                  <span>{opt.name}</span>
                  {opt.subtitle && <span className="opacity-60 text-[10px]">({opt.subtitle})</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Free text input for temporary/unregistered items */}
      <div className="flex gap-1.5">
        <Input
          placeholder={placeholder}
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={addCustom}
          className="text-xs h-8"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCustom}
          disabled={!customInput.trim()}
          className="h-8 px-2 text-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Adicionar
        </Button>
      </div>
    </div>
  );
};

export const SchedulePage = () => {
  const { toast } = useToast();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [showExecutionForm, setShowExecutionForm] = useState(false);
  const [showPartialExecutionsModal, setShowPartialExecutionsModal] = useState(false);
  const [editingExecution, setEditingExecution] = useState<Execution | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);

  const [collaboratorsList, setCollaboratorsList] = useState<CollaboratorOption[]>([]);
  const [equipmentList, setEquipmentList] = useState<EquipmentOption[]>([]);

  const [formData, setFormData] = useState<Execution>({
    id: "",
    clientName: "",
    clientId: "",
    farmName: "",
    farmId: "",
    serviceName: "",
    area: "",
    scheduledDate: "",
    equipmentNames: [],
    collaborators: [],
    status: "Pendente",
    notes: "",
    partialExecutions: []
  });

  const [partialExecutionForm, setPartialExecutionForm] = useState<{
    date: string;
    executedArea: string;
    equipmentNames: string[];
    collaborators: string[];
    notes: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    executedArea: "",
    equipmentNames: [],
    collaborators: [],
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
    } catch (err) {
      console.error("Erro ao carregar colaboradores:", err);
    }
  };

  const fetchEquipment = async () => {
    try {
      const data = await api.get<any[]>('/equipment');
      if (Array.isArray(data)) {
        setEquipmentList(data.map(e => ({
          id: e.id,
          name: e.name || e.model || "Equipamento",
          type: e.type || "Geral"
        })));
      }
    } catch {
      setEquipmentList([
        { id: "1", name: "Drone Pulverizador DJI Agras T40", type: "Drone" },
        { id: "2", name: "Drone Mapeador DJI Mavic 3M", type: "Drone" },
        { id: "3", name: "Trator John Deere 6110M", type: "Trator" },
        { id: "4", name: "Quadriciclo Honda TRX 420 Fourtrax", type: "Quadriciclo" },
        { id: "5", name: "Amostrador Hidráulico de Solo", type: "Amostrador" }
      ]);
    }
  };

  const extractEquipments = (source: any): string[] => {
    if (!source) return [];
    if (Array.isArray(source.equipmentNames) && source.equipmentNames.length > 0) return source.equipmentNames;
    if (Array.isArray(source.equipments) && source.equipments.length > 0) return source.equipments;
    if (source.equipment && typeof source.equipment === 'string' && source.equipment !== 'Padrão') return [source.equipment];
    if (source.equipmentName && typeof source.equipmentName === 'string') return [source.equipmentName];
    return [];
  };

  const extractCollaborators = (source: any): string[] => {
    if (!source) return [];
    if (Array.isArray(source.collaborators) && source.collaborators.length > 0) return source.collaborators;
    if (Array.isArray(source.collaboratorNames) && source.collaboratorNames.length > 0) return source.collaboratorNames;
    if (source.collaborator && typeof source.collaborator === 'string') return [source.collaborator];
    if (source.collaboratorName && typeof source.collaboratorName === 'string') return [source.collaboratorName];
    if (source.operator && typeof source.operator === 'string') return [source.operator];
    return [];
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
            clientName: o.client?.name || o.client_name || "Cliente",
            clientId: o.client_id || "",
            farmName: o.farm?.name || o.farm_name || "Fazenda",
            farmId: o.farm_id || "",
            serviceName: o.service_name || o.service || o.type || "Serviço Geral",
            area: (o.area !== null && o.area !== undefined) ? String(o.area) : "0",
            scheduledDate: latestSchedule?.date || latestSchedule?.scheduledDate || (o.created_at ? o.created_at.split('T')[0] : ""),
            equipmentNames: extractEquipments(latestSchedule),
            collaborators: extractCollaborators(latestSchedule),
            status: o.status || "Pendente",
            notes: latestSchedule?.notes || latestSchedule?.description || "",
            partialExecutions: rawExecutions.map((pe: any, idx: number) => ({
              id: pe.id || \`exec-\${idx}\`,
              date: pe.date || "",
              executedArea: (pe.hectares !== undefined ? pe.hectares : (pe.areaExecuted !== undefined ? pe.areaExecuted : (pe.executedArea || "0"))).toString(),
              equipmentNames: extractEquipments(pe),
              collaborators: extractCollaborators(pe),
              notes: pe.notes || "",
              status: pe.status || "Concluída"
            }))
          };
        });
        setExecutions(mapped);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar execuções da agenda",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (execution: Execution) => {
    setEditingExecution(execution);
    setFormData(execution);
    setShowExecutionForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExecution) return;

    try {
      const scheduleEntry = {
        date: formData.scheduledDate,
        scheduledDate: formData.scheduledDate,
        equipmentNames: formData.equipmentNames,
        equipment: formData.equipmentNames.join(', ') || "Padrão",
        collaborators: formData.collaborators,
        collaborator: formData.collaborators.join(', '),
        notes: formData.notes || "Agendado via Agenda de Serviços",
        status: formData.status
      };

      await api.put(\`/orders/\${editingExecution.id}\`, {
        status: formData.status,
        schedules: [
          ...((editingExecution.partialExecutions as any) || []),
          scheduleEntry
        ]
      });

      setExecutions(prev => prev.map(ex => ex.id === editingExecution.id ? formData : ex));
      toast({
        title: "Agendamento atualizado",
        description: "Equipe, equipamentos e data salvos com sucesso.",
      });
      resetForm();
      fetchExecutions();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar execução",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleOpenPartialsModal = (execution: Execution) => {
    setSelectedExecution(execution);
    setPartialExecutionForm({
      date: new Date().toISOString().split('T')[0],
      executedArea: "",
      equipmentNames: execution.equipmentNames.length > 0 ? [...execution.equipmentNames] : [],
      collaborators: execution.collaborators.length > 0 ? [...execution.collaborators] : [],
      notes: ""
    });
    setShowPartialExecutionsModal(true);
  };

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
        notes: partialExecutionForm.notes,
        status: "Concluída"
      };

      const updatedPartials = [...selectedExecution.partialExecutions, newPartial];
      const totalExec = updatedPartials.reduce((sum, p) => sum + parseFloat(p.executedArea || "0"), 0);
      const totalArea = parseFloat(selectedExecution.area || "0");
      const nextStatus = totalExec >= totalArea && totalArea > 0 ? "Concluído" : "Em Andamento";

      await api.put(\`/orders/\${selectedExecution.id}\`, {
        executed_area: totalExec,
        status: nextStatus,
        executions: updatedPartials.map(p => ({
          id: p.id,
          date: p.date,
          hectares: parseFloat(p.executedArea),
          areaExecuted: parseFloat(p.executedArea),
          equipmentNames: p.equipmentNames,
          equipmentName: p.equipmentNames.join(', '),
          collaborators: p.collaborators,
          operator: p.collaborators.join(', '),
          collaboratorName: p.collaborators.join(', '),
          notes: p.notes,
          status: "Concluída"
        }))
      });

      setSelectedExecution({
        ...selectedExecution,
        status: nextStatus,
        partialExecutions: updatedPartials
      });

      setExecutions(prev => prev.map(ex => 
        ex.id === selectedExecution.id 
          ? { ...ex, status: nextStatus, partialExecutions: updatedPartials }
          : ex
      ));

      toast({
        title: "Execução registrada",
        description: \`\${areaNum} ha adicionados com sucesso.\`,
      });

      setPartialExecutionForm(prev => ({
        ...prev,
        executedArea: "",
        notes: ""
      }));
      fetchExecutions();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar execução parcial",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeletePartialExecution = async (partialId: string) => {
    if (!selectedExecution) return;

    try {
      const updatedPartials = selectedExecution.partialExecutions.filter(p => p.id !== partialId);
      const totalExec = updatedPartials.reduce((sum, p) => sum + parseFloat(p.executedArea || "0"), 0);
      const totalArea = parseFloat(selectedExecution.area || "0");
      const nextStatus = totalExec >= totalArea && totalArea > 0 ? "Concluído" : (totalExec > 0 ? "Em Andamento" : "Aprovado");

      await api.put(\`/orders/\${selectedExecution.id}\`, {
        executed_area: totalExec,
        status: nextStatus,
        executions: updatedPartials.map(p => ({
          id: p.id,
          date: p.date,
          hectares: parseFloat(p.executedArea),
          areaExecuted: parseFloat(p.executedArea),
          equipmentNames: p.equipmentNames,
          equipmentName: p.equipmentNames.join(', '),
          collaborators: p.collaborators,
          operator: p.collaborators.join(', '),
          collaboratorName: p.collaborators.join(', '),
          notes: p.notes
        }))
      });

      setSelectedExecution({
        ...selectedExecution,
        status: nextStatus,
        partialExecutions: updatedPartials
      });

      setExecutions(prev => prev.map(ex => 
        ex.id === selectedExecution.id 
          ? { ...ex, status: nextStatus, partialExecutions: updatedPartials }
          : ex
      ));

      toast({
        title: "Execução removida",
        description: "Registro de execução parcial excluído.",
      });
      fetchExecutions();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir execução parcial",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      id: "",
      clientName: "",
      clientId: "",
      farmName: "",
      farmId: "",
      serviceName: "",
      area: "",
      scheduledDate: "",
      equipmentNames: [],
      collaborators: [],
      status: "Pendente",
      notes: "",
      partialExecutions: []
    });
    setEditingExecution(null);
    setShowExecutionForm(false);
  };

  const calculateTotalArea = (partials: PartialExecution[]) => {
    return partials.reduce((sum, pe) => sum + (parseFloat(pe.executedArea) || 0), 0);
  };

  const filteredExecutions = executions.filter(execution => {
    if (statusFilter === "Todos") return true;
    return execution.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda de Serviços</h1>
          <p className="text-muted-foreground">
            Alocação de equipes, equipamentos e controle de execuções de campo
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="statusFilter" className="text-sm whitespace-nowrap">Filtrar por Status:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Operações e Serviços de Campo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Carregando agenda operacional...
            </div>
          ) : filteredExecutions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg text-sm">
              Nenhuma operação encontrada para o filtro selecionado.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente / Fazenda</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Área (ha)</TableHead>
                    <TableHead>Data Agendada</TableHead>
                    <TableHead>Equipe / Colaboradores</TableHead>
                    <TableHead>Equipamentos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExecutions.map((execution) => (
                    <TableRow key={execution.id}>
                      <TableCell>
                        <div className="font-semibold text-foreground">{execution.clientName}</div>
                        <div className="text-xs text-muted-foreground">{execution.farmName}</div>
                      </TableCell>
                      <TableCell className="font-medium text-xs">{execution.serviceName}</TableCell>
                      <TableCell className="text-xs font-semibold">{execution.area} ha</TableCell>
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
                      <TableCell>
                        {execution.collaborators && execution.collaborators.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {execution.collaborators.map((c, i) => (
                              <Badge key={i} variant="secondary" className="text-[11px] py-0 px-1.5 font-normal bg-blue-50 text-blue-800 border-blue-200">
                                <Users className="h-2.5 w-2.5 mr-1 text-blue-600" />
                                {c}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Não atribuído</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {execution.equipmentNames && execution.equipmentNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {execution.equipmentNames.map((eq, i) => (
                              <Badge key={i} variant="outline" className="text-[11px] py-0 px-1.5 font-normal bg-muted/30">
                                <Wrench className="h-2.5 w-2.5 mr-1 text-muted-foreground" />
                                {eq}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            execution.status === "Concluído"
                              ? "default"
                              : execution.status === "Em Andamento"
                              ? "secondary"
                              : "outline"
                          }
                          className={
                            execution.status === "Concluído"
                              ? "bg-green-600 hover:bg-green-700"
                              : execution.status === "Em Andamento"
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : ""
                          }
                        >
                          {execution.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => handleEdit(execution)}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            Agendar / Equipe
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 text-xs bg-primary/10 hover:bg-primary/20 text-primary"
                            onClick={() => handleOpenPartialsModal(execution)}
                          >
                            <ChevronRight className="h-3.5 w-3.5 mr-1" />
                            Execuções ({execution.partialExecutions.length})
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Agendamento e Alocação de Equipe/Equipamentos */}
      <Dialog open={showExecutionForm} onOpenChange={setShowExecutionForm}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Agendar Operação e Alocar Equipe
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 border rounded-md bg-muted/30 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Cliente:</span> <strong>{formData.clientName}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Fazenda:</span> <strong>{formData.farmName}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Serviço:</span> <strong>{formData.serviceName}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Área Total:</span> <strong>{formData.area} ha</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sched-date" className="text-xs font-semibold">Data Agendada:</Label>
                <Input
                  id="sched-date"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="sched-status" className="text-xs font-semibold">Status Operacional:</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                >
                  <SelectTrigger id="sched-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Agendado">Agendado</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SELEÇÃO MÚLTIPLA DE COLABORADORES */}
            <MultiSelectChips
              label="Colaboradores e Operadores"
              icon={<Users className="h-4 w-4 text-blue-600" />}
              availableOptions={collaboratorsList.map(c => ({
                id: c.id,
                name: c.name,
                subtitle: c.role
              }))}
              selectedValues={formData.collaborators}
              onChange={(cols) => setFormData(prev => ({ ...prev, collaborators: cols }))}
              placeholder="Digite o nome de outro colaborador e tecle Enter..."
            />

            {/* SELEÇÃO MÚLTIPLA DE EQUIPAMENTOS */}
            <MultiSelectChips
              label="Equipamentos e Ferramentas"
              icon={<Wrench className="h-4 w-4 text-amber-600" />}
              availableOptions={equipmentList.map(eq => ({
                id: eq.id,
                name: eq.name,
                subtitle: eq.type
              }))}
              selectedValues={formData.equipmentNames}
              onChange={(eqs) => setFormData(prev => ({ ...prev, equipmentNames: eqs }))}
              placeholder="Digite outro equipamento e tecle Enter..."
            />

            <div>
              <Label htmlFor="sched-notes" className="text-xs font-semibold">Observações / Instruções de Campo:</Label>
              <Input
                id="sched-notes"
                placeholder="Ex: Ponto de encontro às 07:00, talhões 1 a 4"
                value={formData.notes || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Salvar Agendamento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Execuções de Campo (Parciais e Totais) */}
      <Dialog open={showPartialExecutionsModal} onOpenChange={setShowPartialExecutionsModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Execuções de Campo - {selectedExecution?.serviceName} ({selectedExecution?.farmName})
            </DialogTitle>
          </DialogHeader>

          {selectedExecution && (
            <div className="space-y-5">
              {/* Box de Resumo de Área */}
              <div className="bg-muted/40 p-3 rounded-lg border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block">Área Total:</span>
                  <strong className="text-sm">{selectedExecution.area} ha</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Executada:</span>
                  <strong className="text-sm text-green-700">
                    {calculateTotalArea(selectedExecution.partialExecutions).toFixed(2)} ha
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Saldo Restante:</span>
                  <strong className="text-sm text-amber-700">
                    {Math.max(0, parseFloat(selectedExecution.area || "0") - calculateTotalArea(selectedExecution.partialExecutions)).toFixed(2)} ha
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Status:</span>
                  <Badge variant="outline" className="mt-0.5">
                    {selectedExecution.status}
                  </Badge>
                </div>
              </div>

              {/* Formulário para Adicionar Execução Parcial */}
              <form onSubmit={handleAddPartialExecution} className="p-4 border rounded-lg bg-card space-y-4">
                <h4 className="font-semibold text-xs text-primary uppercase tracking-wider">
                  + Registrar Nova Etapa de Execução
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Data da Execução:</Label>
                    <Input
                      type="date"
                      value={partialExecutionForm.date}
                      onChange={(e) => setPartialExecutionForm(prev => ({ ...prev, date: e.target.value }))}
                      required
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Área Executada nesta Etapa (ha):</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 25.5"
                      value={partialExecutionForm.executedArea}
                      onChange={(e) => setPartialExecutionForm(prev => ({ ...prev, executedArea: e.target.value }))}
                      required
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Multi-Select de Colaboradores na Execução */}
                <MultiSelectChips
                  label="Equipe / Operadores Presentes"
                  icon={<Users className="h-3.5 w-3.5 text-blue-600" />}
                  availableOptions={collaboratorsList.map(c => ({
                    id: c.id,
                    name: c.name,
                    subtitle: c.role
                  }))}
                  selectedValues={partialExecutionForm.collaborators}
                  onChange={(cols) => setPartialExecutionForm(prev => ({ ...prev, collaborators: cols }))}
                  placeholder="Adicionar operador..."
                />

                {/* Multi-Select de Equipamentos na Execução */}
                <MultiSelectChips
                  label="Equipamentos Utilizados"
                  icon={<Wrench className="h-3.5 w-3.5 text-amber-600" />}
                  availableOptions={equipmentList.map(eq => ({
                    id: eq.id,
                    name: eq.name,
                    subtitle: eq.type
                  }))}
                  selectedValues={partialExecutionForm.equipmentNames}
                  onChange={(eqs) => setPartialExecutionForm(prev => ({ ...prev, equipmentNames: eqs }))}
                  placeholder="Adicionar equipamento..."
                />

                <div>
                  <Label className="text-xs font-semibold">Observações da Operação:</Label>
                  <Input
                    placeholder="Condições climáticas, talhão específico, etc."
                    value={partialExecutionForm.notes}
                    onChange={(e) => setPartialExecutionForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="text-xs"
                  />
                </div>

                <Button type="submit" size="sm" className="w-full bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-1" />
                  Salvar Execução Parcial
                </Button>
              </form>

              {/* Tabela de Execuções Registradas */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Histórico de Execuções ({selectedExecution.partialExecutions.length}):
                </Label>

                {selectedExecution.partialExecutions.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded">
                    Nenhuma execução parcial registrada ainda.
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Data</TableHead>
                          <TableHead className="text-xs">Área</TableHead>
                          <TableHead className="text-xs">Equipe</TableHead>
                          <TableHead className="text-xs">Equipamentos</TableHead>
                          <TableHead className="text-xs">Obs</TableHead>
                          <TableHead className="text-right text-xs">Excluir</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedExecution.partialExecutions.map((pe) => (
                          <TableRow key={pe.id}>
                            <TableCell className="text-xs font-medium whitespace-nowrap">
                              {pe.date ? new Date(pe.date + 'T00:00:00').toLocaleDateString('pt-BR') : "-"}
                            </TableCell>
                            <TableCell className="text-xs font-bold text-green-700">
                              {pe.executedArea} ha
                            </TableCell>
                            <TableCell className="text-xs">
                              {pe.collaborators && pe.collaborators.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {pe.collaborators.map((c, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-[10px] py-0 px-1 font-normal bg-blue-50 text-blue-800">
                                      {c}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground italic text-[11px]">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs">
                              {pe.equipmentNames && pe.equipmentNames.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {pe.equipmentNames.map((eq, idx) => (
                                    <Badge key={idx} variant="outline" className="text-[10px] py-0 px-1 font-normal">
                                      {eq}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground italic text-[11px]">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground italic max-w-[150px] truncate">
                              {pe.notes || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePartialExecution(pe.id)}
                                className="text-destructive hover:text-destructive h-7 w-7 p-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowPartialExecutionsModal(false)}>
                  Fechar
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

fs.writeFileSync(path.join(frontendRoot, 'src/components/pages/SchedulePage.tsx'), schedulePageCode);
console.log('Successfully upgraded SchedulePage.tsx with multi-select collaborators and equipment!');
