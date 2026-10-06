const fs = require('fs');

// 1. Update SchedulePage.tsx
const schedulePageCode = `import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Edit, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";

interface Execution {
  id: string;
  clientName: string;
  clientId: string;
  farmName: string;
  farmId: string;
  serviceName: string;
  area: string;
  scheduledDate: string;
  equipmentName: string;
  status: string;
  partialExecutions: PartialExecution[];
}

interface PartialExecution {
  id: string;
  date: string;
  executedArea: string;
  equipmentName: string;
  operator: string;
  notes: string;
  status: string;
}

const statusOptions = ["Todos", "Pendente", "Agendado", "Em Andamento", "Concluído"];

const AgendaPage = () => {
  const { toast } = useToast();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [showExecutionForm, setShowExecutionForm] = useState(false);
  const [showPartialExecutionsModal, setShowPartialExecutionsModal] = useState(false);
  const [editingExecution, setEditingExecution] = useState<Execution | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);

  const [formData, setFormData] = useState<Execution>({
    id: "",
    clientName: "",
    clientId: "",
    farmName: "",
    farmId: "",
    serviceName: "",
    area: "",
    scheduledDate: "",
    equipmentName: "",
    status: "Pendente",
    partialExecutions: []
  });

  const [partialExecutionForm, setPartialExecutionForm] = useState<PartialExecution>({
    id: "",
    date: "",
    executedArea: "",
    equipmentName: "",
    operator: "",
    notes: "",
    status: "Concluída"
  });

  const [equipmentList, setEquipmentList] = useState<string[]>([]);

  useEffect(() => {
    fetchExecutions();
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const data = await api.get<any[]>('/equipment');
      if (Array.isArray(data)) {
        setEquipmentList(data.map(e => e.name || e.model || "Equipamento"));
      }
    } catch {
      setEquipmentList(["Drone Agrícola 01", "Trator John Deere 6110M", "Pulverizador Uniport 3030"]);
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
            clientName: o.client_name || o.client?.name || "Cliente",
            clientId: o.client_id || "",
            farmName: o.farm_name || o.farm?.name || "Fazenda",
            farmId: o.farm_id || "",
            serviceName: o.service || "Serviço Geral",
            area: o.area?.toString() || "0",
            scheduledDate: latestSchedule?.date || (o.created_at ? o.created_at.split('T')[0] : ""),
            equipmentName: latestSchedule?.equipment || "Padrão",
            status: o.status || "Pendente",
            partialExecutions: rawExecutions.map((pe: any, idx: number) => ({
              id: pe.id || \`exec-\${idx}\`,
              date: pe.date || "",
              executedArea: pe.hectares?.toString() || pe.executedArea?.toString() || "0",
              equipmentName: pe.equipmentName || "Equipamento",
              operator: pe.operator || pe.userName || "Operador",
              notes: pe.notes || "",
              status: "Concluída"
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
      await api.put(\`/orders/\${editingExecution.id}\`, {
        status: formData.status,
        schedules: [
          ...((editingExecution.partialExecutions as any) || []),
          { date: formData.scheduledDate, equipment: formData.equipmentName, notes: "Agendado via Agenda" }
        ]
      });

      setExecutions(prev => prev.map(ex => ex.id === editingExecution.id ? formData : ex));
      toast({
        title: "Execução atualizada",
        description: "A execução foi atualizada com sucesso no backend.",
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

  const handleAddPartialExecution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExecution) return;

    try {
      const newPartial: PartialExecution = {
        id: Date.now().toString(),
        date: partialExecutionForm.date,
        executedArea: partialExecutionForm.executedArea,
        equipmentName: partialExecutionForm.equipmentName,
        operator: partialExecutionForm.operator,
        notes: partialExecutionForm.notes,
        status: "Concluída"
      };

      const updatedPartials = [...selectedExecution.partialExecutions, newPartial];
      const totalExec = updatedPartials.reduce((sum, p) => sum + parseFloat(p.executedArea || "0"), 0);
      const totalArea = parseFloat(selectedExecution.area || "0");
      const nextStatus = totalExec >= totalArea ? "Concluído" : "Em Andamento";

      await api.put(\`/orders/\${selectedExecution.id}\`, {
        executed_area: totalExec,
        status: nextStatus,
        executions: updatedPartials.map(p => ({
          id: p.id,
          date: p.date,
          hectares: parseFloat(p.executedArea),
          equipmentName: p.equipmentName,
          operator: p.operator,
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
        title: "Execução parcial adicionada",
        description: "Execução parcial salva no banco de dados com sucesso.",
      });

      setPartialExecutionForm({
        id: "",
        date: "",
        executedArea: "",
        equipmentName: "",
        operator: "",
        notes: "",
        status: "Concluída"
      });
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

      await api.put(\`/orders/\${selectedExecution.id}\`, {
        executed_area: totalExec,
        executions: updatedPartials.map(p => ({
          id: p.id,
          date: p.date,
          hectares: parseFloat(p.executedArea),
          equipmentName: p.equipmentName,
          operator: p.operator,
          notes: p.notes
        }))
      });

      setSelectedExecution({
        ...selectedExecution,
        partialExecutions: updatedPartials
      });

      setExecutions(prev => prev.map(ex => 
        ex.id === selectedExecution.id 
          ? { ...ex, partialExecutions: updatedPartials }
          : ex
      ));

      toast({
        title: "Execução parcial removida",
        description: "Execução parcial excluída com sucesso.",
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
      equipmentName: "",
      status: "Pendente",
      partialExecutions: []
    });
    setEditingExecution(null);
    setShowExecutionForm(false);
  };

  const handleInputChange = (field: keyof Execution, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const filteredExecutions = executions.filter(execution => {
    if (statusFilter === "Todos") return true;
    return execution.status === statusFilter;
  });

  const calculateTotalArea = (partials: PartialExecution[]) => {
    return partials.reduce((sum, pe) => sum + (parseFloat(pe.executedArea) || 0), 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Agenda de Serviços</h1>
          <p className="text-sm text-muted-foreground">Gerencie agendamentos e execuções de campo</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {statusOptions.map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(status)}
            className="text-xs sm:text-sm"
          >
            {status}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Execuções e Agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando agendamentos...</div>
          ) : filteredExecutions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhuma execução encontrada.</div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table className="min-w-[750px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Fazenda</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Área (ha)</TableHead>
                      <TableHead>Data Agendada</TableHead>
                      <TableHead>Equipamento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progresso</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExecutions.map((execution) => {
                      const totalExecuted = calculateTotalArea(execution.partialExecutions);
                      const totalArea = parseFloat(execution.area) || 0;
                      const progress = totalArea > 0 ? (totalExecuted / totalArea) * 100 : 0;

                      return (
                        <TableRow key={execution.id}>
                          <TableCell className="font-medium">{execution.clientName}</TableCell>
                          <TableCell>{execution.farmName}</TableCell>
                          <TableCell>{execution.serviceName}</TableCell>
                          <TableCell>{execution.area} ha</TableCell>
                          <TableCell>
                            {execution.scheduledDate ? new Date(execution.scheduledDate).toLocaleDateString('pt-BR') : "-"}
                          </TableCell>
                          <TableCell>{execution.equipmentName || "-"}</TableCell>
                          <TableCell>
                            <span className={\`px-2 py-1 rounded-full text-xs font-semibold \${
                              execution.status === "Concluído" ? "bg-green-100 text-green-800" :
                              execution.status === "Em Andamento" ? "bg-blue-100 text-blue-800" :
                              execution.status === "Agendado" ? "bg-purple-100 text-purple-800" :
                              "bg-yellow-100 text-yellow-800"
                            }\`}>
                              {execution.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="w-full bg-secondary rounded-full h-2 min-w-[70px]">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: \`\${Math.min(progress, 100)}%\` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {totalExecuted.toFixed(1)} / {execution.area} ha ({progress.toFixed(0)}%)
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedExecution(execution);
                                  setShowPartialExecutionsModal(true);
                                }}
                              >
                                Execuções
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(execution)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Execution Form Modal */}
      <Dialog open={showExecutionForm} onOpenChange={setShowExecutionForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Agendamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cliente</Label>
                <Input value={formData.clientName} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>Fazenda</Label>
                <Input value={formData.farmName} readOnly className="bg-muted" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Serviço</Label>
                <Input value={formData.serviceName} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>Área (ha)</Label>
                <Input value={formData.area} readOnly className="bg-muted" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Agendada</Label>
                <Input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => handleInputChange("scheduledDate", e.target.value)}
                />
              </div>
              <div>
                <Label>Equipamento</Label>
                <Select value={formData.equipmentName} onValueChange={(value) => handleInputChange("equipmentName", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentList.map((eq) => (
                      <SelectItem key={eq} value={eq}>{eq}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger>
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
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Partial Executions Modal */}
      <Dialog open={showPartialExecutionsModal} onOpenChange={setShowPartialExecutionsModal}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Execuções de Campo - {selectedExecution?.serviceName}</DialogTitle>
          </DialogHeader>
          
          {selectedExecution && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Área Total:</span> {selectedExecution.area} ha
                  </div>
                  <div>
                    <span className="font-medium">Área Executada:</span> {calculateTotalArea(selectedExecution.partialExecutions).toFixed(2)} ha
                  </div>
                  <div>
                    <span className="font-medium">Área Restante:</span> {(parseFloat(selectedExecution.area || "0") - calculateTotalArea(selectedExecution.partialExecutions)).toFixed(2)} ha
                  </div>
                </div>
              </div>

              <form onSubmit={handleAddPartialExecution} className="space-y-4 border p-4 rounded-lg">
                <h4 className="font-medium text-sm">Adicionar Execução Parcial</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={partialExecutionForm.date}
                      onChange={(e) => setPartialExecutionForm(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label>Área Executada (ha)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={partialExecutionForm.executedArea}
                      onChange={(e) => setPartialExecutionForm(prev => ({ ...prev, executedArea: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label>Equipamento</Label>
                    <Select 
                      value={partialExecutionForm.equipmentName} 
                      onValueChange={(value) => setPartialExecutionForm(prev => ({ ...prev, equipmentName: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipmentList.map((eq) => (
                          <SelectItem key={eq} value={eq}>{eq}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Operador</Label>
                    <Input
                      value={partialExecutionForm.operator}
                      onChange={(e) => setPartialExecutionForm(prev => ({ ...prev, operator: e.target.value }))}
                      placeholder="Nome do operador"
                    />
                  </div>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Input
                    value={partialExecutionForm.notes}
                    onChange={(e) => setPartialExecutionForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Condições climáticas, talhão específico, etc."
                  />
                </div>
                <Button type="submit" className="w-full">Adicionar Execução</Button>
              </form>

              {selectedExecution.partialExecutions.length > 0 && (
                <div className="overflow-x-auto">
                  <Table className="min-w-[550px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Área (ha)</TableHead>
                        <TableHead>Equipamento</TableHead>
                        <TableHead>Operador</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedExecution.partialExecutions.map((pe) => (
                        <TableRow key={pe.id}>
                          <TableCell>{pe.date ? new Date(pe.date).toLocaleDateString('pt-BR') : "-"}</TableCell>
                          <TableCell className="font-semibold">{pe.executedArea} ha</TableCell>
                          <TableCell>{pe.equipmentName || "-"}</TableCell>
                          <TableCell>{pe.operator || "-"}</TableCell>
                          <TableCell>
                            <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                              {pe.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeletePartialExecution(pe.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgendaPage;
`;

fs.writeFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/SchedulePage.tsx', schedulePageCode);
console.log('SchedulePage.tsx updated.');

// 2. Update AnalysisPage.tsx
const analysisPageCode = `import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Edit, Search, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";

interface AnalysisExecution {
  id: string;
  analysisName: string;
  collaborator: string;
  clientId: string;
  clientName: string;
  farmId: string;
  farmName: string;
  plotId: string;
  plotName: string;
  quantity: number;
  status: "Pendente" | "Enviado" | "Recebido" | "Executando" | "Finalizado";
  sendDate: string;
  receiptDate: string;
  completionDate: string;
}

const AnalisesPrincipalPage = () => {
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<AnalysisExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<{id: string; name: string}[]>([]);
  const [farms, setFarms] = useState<{id: string; name: string}[]>([]);
  const [plots, setPlots] = useState<{id: string; name: string}[]>([]);

  const collaboratorsConfig = [
    { id: "1", name: "Laboratório Solo Forte" },
    { id: "2", name: "Laboratório AgroAnálises" },
    { id: "3", name: "IBRA Análises de Solo" }
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [collaboratorFilter, setCollaboratorFilter] = useState("");
  const [analysesPage, setAnalysesPage] = useState(1);
  const [analysesPerPage, setAnalysesPerPage] = useState(10);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAnalysis, setEditingAnalysis] = useState<AnalysisExecution | null>(null);
  const [formData, setFormData] = useState<AnalysisExecution>({
    id: "",
    analysisName: "",
    collaborator: "",
    clientId: "",
    clientName: "",
    farmId: "",
    farmName: "",
    plotId: "",
    plotName: "",
    quantity: 1,
    status: "Pendente",
    sendDate: "",
    receiptDate: "",
    completionDate: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analysesRes, clientsRes, farmsRes] = await Promise.all([
        api.get<any[]>('/analyses').catch(() => []),
        api.get<any[]>('/clients').catch(() => []),
        api.get<any[]>('/farms').catch(() => [])
      ]);

      const mapped: AnalysisExecution[] = (Array.isArray(analysesRes) ? analysesRes : []).map(a => ({
        id: a.id,
        analysisName: a.type || a.analysis_name || "Análise Química Completa",
        collaborator: a.collaborator || "Laboratório Padrão",
        clientId: a.client_id || "",
        clientName: a.client_name || "Produtor Rural",
        farmId: a.farm_id || "",
        farmName: a.farm_name || "Fazenda",
        plotId: a.plot_id || "",
        plotName: a.plot_name || "Geral",
        quantity: a.quantity || 1,
        status: a.status || "Pendente",
        sendDate: a.date || a.send_date || "",
        receiptDate: a.receipt_date || "",
        completionDate: a.completion_date || ""
      }));

      setAnalyses(mapped);
      setClients(Array.isArray(clientsRes) ? clientsRes : []);
      setFarms(Array.isArray(farmsRes) ? farmsRes : []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar análises",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch = 
      (analysis.collaborator || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (analysis.clientName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (analysis.farmName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (analysis.analysisName || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCollab = !collaboratorFilter || analysis.collaborator === collaboratorFilter;
    return matchesSearch && matchesCollab;
  });

  const totalPages = Math.ceil(filteredAnalyses.length / analysesPerPage);
  const currentAnalyses = filteredAnalyses.slice(
    (analysesPage - 1) * analysesPerPage,
    analysesPage * analysesPerPage
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/analyses', {
        type: formData.analysisName,
        farm_id: formData.farmId || null,
        plot_id: formData.plotId || null,
        status: formData.status,
        date: formData.sendDate,
        results: {
          collaborator: formData.collaborator,
          quantity: formData.quantity,
          clientName: formData.clientName,
          farmName: formData.farmName
        }
      });

      toast({ title: "Análise criada", description: "Nova análise registrada com sucesso no backend." });
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro ao criar análise", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnalysis) return;

    try {
      await api.put(\`/analyses/\${editingAnalysis.id}\`, {
        type: formData.analysisName,
        farm_id: formData.farmId || null,
        plot_id: formData.plotId || null,
        status: formData.status,
        date: formData.sendDate,
        results: {
          collaborator: formData.collaborator,
          quantity: formData.quantity,
          clientName: formData.clientName,
          farmName: formData.farmName,
          receiptDate: formData.receiptDate,
          completionDate: formData.completionDate
        }
      });

      toast({ title: "Análise atualizada", description: "Análise atualizada com sucesso no backend." });
      setShowEditModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro ao atualizar análise", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(\`/analyses/\${id}\`);
      toast({ title: "Análise excluída", description: "Análise removida com sucesso." });
      fetchData();
    } catch (error: any) {
      toast({ title: "Erro ao excluir análise", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      id: "",
      analysisName: "",
      collaborator: "",
      clientId: "",
      clientName: "",
      farmId: "",
      farmName: "",
      plotId: "",
      plotName: "",
      quantity: 1,
      status: "Pendente",
      sendDate: "",
      receiptDate: "",
      completionDate: ""
    });
    setEditingAnalysis(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Finalizado":
        return <Badge className="bg-green-100 text-green-800 border-none">Finalizado</Badge>;
      case "Executando":
        return <Badge className="bg-blue-100 text-blue-800 border-none">Executando</Badge>;
      case "Recebido":
        return <Badge className="bg-purple-100 text-purple-800 border-none">Recebido</Badge>;
      case "Enviado":
        return <Badge className="bg-yellow-100 text-yellow-800 border-none">Enviado</Badge>;
      default:
        return <Badge className="bg-secondary text-secondary-foreground border-none">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Análises Laboratoriais</h1>
          <p className="text-sm text-muted-foreground">Controle de envio, recebimento e laudos de amostras de solo e folhas</p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateModal(true); }} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Nova Análise
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, fazenda ou tipo de análise..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Análises</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando análises do backend...</div>
          ) : currentAnalyses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhuma análise cadastrada ainda.</div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table className="min-w-[750px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo de Análise</TableHead>
                      <TableHead>Cliente / Fazenda</TableHead>
                      <TableHead>Laboratório</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentAnalyses.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.analysisName}</TableCell>
                        <TableCell>
                          <div>{a.clientName}</div>
                          <div className="text-xs text-muted-foreground">{a.farmName}</div>
                        </TableCell>
                        <TableCell>{a.collaborator}</TableCell>
                        <TableCell>{a.quantity}</TableCell>
                        <TableCell>{getStatusBadge(a.status)}</TableCell>
                        <TableCell>{a.sendDate ? new Date(a.sendDate).toLocaleDateString('pt-BR') : "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingAnalysis(a);
                                setFormData(a);
                                setShowEditModal(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(a.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setAnalysesPage(p => Math.max(1, p - 1))}
                      className={analysesPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="text-xs text-muted-foreground px-2">
                      Página {analysesPage} de {totalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setAnalysesPage(p => Math.min(totalPages, p + 1))}
                      className={analysesPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={showCreateModal || showEditModal} onOpenChange={(open) => {
        if (!open) {
          setShowCreateModal(false);
          setShowEditModal(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{showCreateModal ? "Nova Análise" : "Editar Análise"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={showCreateModal ? handleCreate : handleUpdate} className="space-y-4">
            <div>
              <Label>Tipo de Análise</Label>
              <Input
                value={formData.analysisName}
                onChange={(e) => setFormData(prev => ({ ...prev, analysisName: e.target.value }))}
                placeholder="Ex: Análise Química de Solo (0-20cm)"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cliente</Label>
                <Select 
                  value={formData.clientId} 
                  onValueChange={(val) => {
                    const client = clients.find(c => c.id === val);
                    setFormData(prev => ({ ...prev, clientId: val, clientName: client?.name || "" }));
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Fazenda</Label>
                <Select 
                  value={formData.farmId} 
                  onValueChange={(val) => {
                    const farm = farms.find(f => f.id === val);
                    setFormData(prev => ({ ...prev, farmId: val, farmName: farm?.name || "" }));
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {farms.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Laboratório</Label>
                <Select 
                  value={formData.collaborator} 
                  onValueChange={(val) => setFormData(prev => ({ ...prev, collaborator: val }))}
                >
                  <SelectTrigger><SelectValue placeholder="Laboratório" /></SelectTrigger>
                  <SelectContent>
                    {collaboratorsConfig.map(c => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Quantidade Amostras</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data de Envio</Label>
                <Input
                  type="date"
                  value={formData.sendDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, sendDate: e.target.value }))}
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(val: any) => setFormData(prev => ({ ...prev, status: val }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Enviado">Enviado</SelectItem>
                    <SelectItem value="Recebido">Recebido</SelectItem>
                    <SelectItem value="Executando">Executando</SelectItem>
                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                resetForm();
              }}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnalisesPrincipalPage;
`;

fs.writeFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/AnalysisPage.tsx', analysisPageCode);
console.log('AnalysisPage.tsx updated.');
