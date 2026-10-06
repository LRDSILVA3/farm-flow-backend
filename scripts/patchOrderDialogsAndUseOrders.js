const fs = require('fs');
const path = require('path');

const frontendRoot = 'C:/Users/User/Documents/Projects/farm-flow-frontend';

// 1. Update OrderScheduleDialog.tsx
const orderScheduleDialogCode = `import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Order } from '@/hooks/useOrders';
import { Calendar, Plus, Clock, Users, Wrench, X } from 'lucide-react';
import { api } from '@/services/api';

interface OrderScheduleDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSchedule: (orderId: string, schedule: {
    scheduledDate: string;
    description: string;
    collaborators?: string[];
    equipmentNames?: string[];
  }) => Promise<void>;
}

export const OrderScheduleDialog: React.FC<OrderScheduleDialogProps> = ({
  order,
  open,
  onOpenChange,
  onAddSchedule,
}) => {
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [collaboratorsList, setCollaboratorsList] = useState<{ id: string; name: string; role?: string }[]>([]);
  const [equipmentList, setEquipmentList] = useState<{ id: string; name: string; type?: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchOptions();
    }
  }, [open]);

  const fetchOptions = async () => {
    try {
      const [collabs, equips] = await Promise.all([
        api.get<any[]>('/collaborators').catch(() => []),
        api.get<any[]>('/equipment').catch(() => [])
      ]);
      if (Array.isArray(collabs)) setCollaboratorsList(collabs);
      if (Array.isArray(equips)) setEquipmentList(equips);
    } catch {}
  };

  if (!order) return null;

  const toggleCollaborator = (name: string) => {
    setSelectedCollaborators(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  const toggleEquipment = (name: string) => {
    setSelectedEquipment(prev =>
      prev.includes(name) ? prev.filter(e => e !== name) : [...prev, name]
    );
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDate || !description.trim()) return;

    setSubmitting(true);
    try {
      await onAddSchedule(order.id, {
        scheduledDate,
        description: description.trim(),
        collaborators: selectedCollaborators,
        equipmentNames: selectedEquipment,
      });
      setScheduledDate('');
      setDescription('');
      setSelectedCollaborators([]);
      setSelectedEquipment([]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Agendamento de Serviço e Visitas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-2.5 border rounded-md bg-muted/30 text-xs space-y-1">
            <div className="font-semibold">{order.client?.name || order.clientId} • {order.farm?.name || order.farmId}</div>
            <div className="text-muted-foreground">{order.serviceName || order.type} • {order.area} ha</div>
          </div>

          <form onSubmit={handleAdd} className="p-3 border rounded-md bg-card space-y-3">
            <Label className="font-semibold text-xs block text-primary uppercase tracking-wider">
              + Novo Agendamento / Etapa:
            </Label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label htmlFor="sched-date" className="text-xs font-semibold">Data:</Label>
                <Input
                  id="sched-date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div>
                <Label htmlFor="sched-desc" className="text-xs font-semibold">Etapa / Descrição:</Label>
                <Input
                  id="sched-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: 1ª Visita de Coleta"
                  required
                  className="text-xs"
                />
              </div>
            </div>

            {/* Colaboradores */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-blue-600" />
                Alocar Colaboradores ({selectedCollaborators.length}):
              </Label>
              <div className="flex flex-wrap gap-1 p-1.5 border rounded-md bg-muted/20 min-h-[32px]">
                {selectedCollaborators.length === 0 ? (
                  <span className="text-[11px] text-muted-foreground italic">Nenhum selecionado</span>
                ) : (
                  selectedCollaborators.map(c => (
                    <Badge key={c} variant="secondary" className="text-[11px] py-0 px-1.5 flex items-center gap-1 bg-blue-50 text-blue-800">
                      {c}
                      <button type="button" onClick={() => toggleCollaborator(c)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
              {collaboratorsList.length > 0 && (
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-1 border rounded bg-card">
                  {collaboratorsList.map(c => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => toggleCollaborator(c.name)}
                      className={\`text-[11px] px-1.5 py-0.5 rounded border transition-colors \${
                        selectedCollaborators.includes(c.name)
                          ? 'bg-blue-100 border-blue-400 text-blue-800 font-medium'
                          : 'bg-muted/40 hover:bg-muted text-muted-foreground border-transparent'
                      }\`}
                    >
                      {c.name} {c.role && <span className="opacity-60 text-[9px]">({c.role})</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Equipamentos */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Wrench className="h-3.5 w-3.5 text-amber-600" />
                Alocar Equipamentos ({selectedEquipment.length}):
              </Label>
              <div className="flex flex-wrap gap-1 p-1.5 border rounded-md bg-muted/20 min-h-[32px]">
                {selectedEquipment.length === 0 ? (
                  <span className="text-[11px] text-muted-foreground italic">Nenhum selecionado</span>
                ) : (
                  selectedEquipment.map(eq => (
                    <Badge key={eq} variant="outline" className="text-[11px] py-0 px-1.5 flex items-center gap-1 bg-card">
                      {eq}
                      <button type="button" onClick={() => toggleEquipment(eq)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
              {equipmentList.length > 0 && (
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-1 border rounded bg-card">
                  {equipmentList.map(eq => (
                    <button
                      type="button"
                      key={eq.id}
                      onClick={() => toggleEquipment(eq.name)}
                      className={\`text-[11px] px-1.5 py-0.5 rounded border transition-colors \${
                        selectedEquipment.includes(eq.name)
                          ? 'bg-amber-100 border-amber-400 text-amber-800 font-medium'
                          : 'bg-muted/40 hover:bg-muted text-muted-foreground border-transparent'
                      }\`}
                    >
                      {eq.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              size="sm"
              className="w-full bg-green-600 hover:bg-green-700 mt-2"
              disabled={submitting || !scheduledDate || !description.trim()}
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Agendamento
            </Button>
          </form>

          {/* Lista de agendamentos */}
          <div className="space-y-2">
            <Label className="font-semibold text-xs flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Agendamentos do Pedido ({order.schedules?.length || 0}):
            </Label>

            {(!order.schedules || order.schedules.length === 0) ? (
              <div className="p-3 text-center text-xs text-muted-foreground border border-dashed rounded">
                Nenhum agendamento registrado ainda.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2">
                {order.schedules.map((sc: any, idx) => (
                  <div
                    key={sc.id || idx}
                    className="p-2.5 border rounded-md bg-muted/20 flex flex-col gap-1 text-xs"
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-semibold">{sc.scheduledDate || sc.date}</div>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-medium">
                        {sc.status || 'Agendado'}
                      </span>
                    </div>
                    <div className="text-muted-foreground">{sc.description || sc.notes}</div>
                    {(sc.collaborators?.length > 0 || sc.equipmentNames?.length > 0) && (
                      <div className="flex flex-wrap gap-1 mt-1 pt-1 border-t">
                        {sc.collaborators?.map((c: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-[10px] py-0 px-1 bg-blue-50 text-blue-700">
                            {c}
                          </Badge>
                        ))}
                        {sc.equipmentNames?.map((eq: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px] py-0 px-1">
                            {eq}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
`;

// 2. Update OrderExecutionDialog.tsx
const orderExecutionDialogCode = `import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Order } from '@/hooks/useOrders';
import { Play, CheckCircle2, History, Users, Wrench, X } from 'lucide-react';
import { api } from '@/services/api';

interface OrderExecutionDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecordExecution: (orderId: string, execution: {
    areaExecuted: number;
    notes?: string;
    collaboratorName?: string;
    collaborators?: string[];
    equipmentNames?: string[];
  }) => Promise<void>;
}

export const OrderExecutionDialog: React.FC<OrderExecutionDialogProps> = ({
  order,
  open,
  onOpenChange,
  onRecordExecution,
}) => {
  const [executionType, setExecutionType] = useState<'total' | 'partial'>('total');
  const [partialArea, setPartialArea] = useState<string>('');
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const [collaboratorsList, setCollaboratorsList] = useState<{ id: string; name: string; role?: string }[]>([]);
  const [equipmentList, setEquipmentList] = useState<{ id: string; name: string; type?: string }[]>([]);

  useEffect(() => {
    if (open) {
      fetchOptions();
    }
  }, [open]);

  const fetchOptions = async () => {
    try {
      const [collabs, equips] = await Promise.all([
        api.get<any[]>('/collaborators').catch(() => []),
        api.get<any[]>('/equipment').catch(() => [])
      ]);
      if (Array.isArray(collabs)) setCollaboratorsList(collabs);
      if (Array.isArray(equips)) setEquipmentList(equips);
    } catch {}
  };

  if (!order) return null;

  const totalArea = parseFloat(order.area) || 0;
  const executedArea = order.executedArea || 0;
  const remainingArea = Math.max(0, totalArea - executedArea);
  const percentExecuted = totalArea > 0 ? (executedArea / totalArea) * 100 : 0;

  const toggleCollaborator = (name: string) => {
    setSelectedCollaborators(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  const toggleEquipment = (name: string) => {
    setSelectedEquipment(prev =>
      prev.includes(name) ? prev.filter(e => e !== name) : [...prev, name]
    );
  };

  const handleConfirm = async () => {
    let areaToExecute = 0;
    if (executionType === 'total') {
      areaToExecute = remainingArea;
    } else {
      areaToExecute = parseFloat(partialArea) || 0;
    }

    if (areaToExecute <= 0) return;

    setSubmitting(true);
    try {
      await onRecordExecution(order.id, {
        areaExecuted: areaToExecute,
        collaborators: selectedCollaborators,
        collaboratorName: selectedCollaborators.join(', ') || undefined,
        equipmentNames: selectedEquipment,
        notes: notes.trim() || undefined,
      });
      onOpenChange(false);
      // Reset
      setPartialArea('');
      setNotes('');
      setSelectedCollaborators([]);
      setSelectedEquipment([]);
      setExecutionType('total');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Play className="h-5 w-5 text-primary" />
            Registrar Execução do Serviço
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Summary Box */}
          <div className="p-3 border rounded-md bg-muted/30 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cliente / Fazenda:</span>
              <span className="font-semibold">{order.client?.name || order.clientId} • {order.farm?.name || order.farmId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Serviço:</span>
              <span className="font-semibold">{order.serviceName || order.type}</span>
            </div>
            <div className="flex justify-between border-t pt-1">
              <span className="text-muted-foreground">Área Total Contratada:</span>
              <strong>{totalArea.toFixed(1)} ha</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Área Já Executada:</span>
              <strong className="text-primary">{executedArea.toFixed(1)} ha ({percentExecuted.toFixed(1)}%)</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Saldo Restante a Executar:</span>
              <strong className="text-amber-600">{remainingArea.toFixed(1)} ha</strong>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2 mt-1">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: Math.min(100, percentExecuted) + '%' }}
              />
            </div>
          </div>

          {remainingArea <= 0 ? (
            <div className="p-3 bg-green-50 text-green-800 border border-green-200 rounded-md text-sm flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Este serviço já foi 100% executado e concluído!
            </div>
          ) : (
            <div className="space-y-3">
              <Label className="font-semibold text-xs">Tipo de Execução nesta Etapa:</Label>
              <RadioGroup
                value={executionType}
                onValueChange={(v) => setExecutionType(v as 'total' | 'partial')}
                className="grid grid-cols-2 gap-2"
              >
                <div className="flex items-center space-x-2 border rounded p-2.5 cursor-pointer hover:bg-muted/20">
                  <RadioGroupItem value="total" id="exec-total" />
                  <Label htmlFor="exec-total" className="text-xs cursor-pointer">
                    Executar 100% ({remainingArea.toFixed(1)} ha restantes)
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded p-2.5 cursor-pointer hover:bg-muted/20">
                  <RadioGroupItem value="partial" id="exec-partial" />
                  <Label htmlFor="exec-partial" className="text-xs cursor-pointer">
                    Execução Parcial
                  </Label>
                </div>
              </RadioGroup>

              {executionType === 'partial' && (
                <div>
                  <Label htmlFor="partial-area" className="text-xs">
                    Área Executada nesta Etapa (ha):
                  </Label>
                  <Input
                    id="partial-area"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max={remainingArea}
                    value={partialArea}
                    onChange={(e) => setPartialArea(e.target.value)}
                    placeholder={'Máximo: ' + remainingArea.toFixed(1) + ' ha'}
                  />
                </div>
              )}

              {/* Multi-Select Colaboradores */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-blue-600" />
                  Equipe / Operadores no Campo ({selectedCollaborators.length}):
                </Label>
                <div className="flex flex-wrap gap-1 p-1.5 border rounded-md bg-muted/20 min-h-[32px]">
                  {selectedCollaborators.length === 0 ? (
                    <span className="text-[11px] text-muted-foreground italic">Nenhum operador selecionado</span>
                  ) : (
                    selectedCollaborators.map(c => (
                      <Badge key={c} variant="secondary" className="text-[11px] py-0 px-1.5 flex items-center gap-1 bg-blue-50 text-blue-800">
                        {c}
                        <button type="button" onClick={() => toggleCollaborator(c)} className="hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
                {collaboratorsList.length > 0 && (
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-1 border rounded bg-card">
                    {collaboratorsList.map(c => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => toggleCollaborator(c.name)}
                        className={\`text-[11px] px-1.5 py-0.5 rounded border transition-colors \${
                          selectedCollaborators.includes(c.name)
                            ? 'bg-blue-100 border-blue-400 text-blue-800 font-medium'
                            : 'bg-muted/40 hover:bg-muted text-muted-foreground border-transparent'
                        }\`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Multi-Select Equipamentos */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <Wrench className="h-3.5 w-3.5 text-amber-600" />
                  Equipamentos Utilizados ({selectedEquipment.length}):
                </Label>
                <div className="flex flex-wrap gap-1 p-1.5 border rounded-md bg-muted/20 min-h-[32px]">
                  {selectedEquipment.length === 0 ? (
                    <span className="text-[11px] text-muted-foreground italic">Nenhum equipamento selecionado</span>
                  ) : (
                    selectedEquipment.map(eq => (
                      <Badge key={eq} variant="outline" className="text-[11px] py-0 px-1.5 flex items-center gap-1 bg-card">
                        {eq}
                        <button type="button" onClick={() => toggleEquipment(eq)} className="hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
                {equipmentList.length > 0 && (
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-1 border rounded bg-card">
                    {equipmentList.map(eq => (
                      <button
                        type="button"
                        key={eq.id}
                        onClick={() => toggleEquipment(eq.name)}
                        className={\`text-[11px] px-1.5 py-0.5 rounded border transition-colors \${
                          selectedEquipment.includes(eq.name)
                            ? 'bg-amber-100 border-amber-400 text-amber-800 font-medium'
                            : 'bg-muted/40 hover:bg-muted text-muted-foreground border-transparent'
                        }\`}
                      >
                        {eq.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="exec-notes" className="text-xs">
                  Observações da Execução (opcional):
                </Label>
                <Textarea
                  id="exec-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Condições climáticas boas, realizado nos talhões 1 e 2"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Histórico de execuções anteriores */}
          {order.executions && order.executions.length > 0 && (
            <div className="space-y-1 pt-2 border-t text-xs">
              <Label className="font-semibold flex items-center gap-1 text-muted-foreground">
                <History className="h-3.5 w-3.5" />
                Histórico de Execuções ({order.executions.length}):
              </Label>
              <div className="max-h-36 overflow-y-auto space-y-1">
                {order.executions.map((ex: any, idx) => (
                  <div key={ex.id || idx} className="p-2 bg-muted/40 rounded flex justify-between items-center text-[11px]">
                    <div>
                      <span className="font-medium">{ex.date}</span>: {ex.areaExecuted || ex.hectares} ha ({ex.percentage}%)
                      {(ex.collaborators?.length > 0 || ex.collaboratorName) && (
                        <span className="text-muted-foreground"> • Op: {ex.collaborators?.join(', ') || ex.collaboratorName}</span>
                      )}
                      {(ex.equipmentNames?.length > 0 || ex.equipmentName) && (
                        <span className="text-muted-foreground"> • Eq: {ex.equipmentNames?.join(', ') || ex.equipmentName}</span>
                      )}
                      {ex.notes && <div className="text-muted-foreground italic text-[10px]">{ex.notes}</div>}
                    </div>
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {remainingArea > 0 && (
            <Button
              type="button"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleConfirm}
              disabled={submitting || (executionType === 'partial' && (!partialArea || parseFloat(partialArea) <= 0))}
            >
              Confirmar Execução
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
`;

// 3. Update useOrders.ts to support collaborators and equipmentNames arrays
const useOrdersPath = path.join(frontendRoot, 'src/hooks/useOrders.ts');
let useOrdersContent = fs.readFileSync(useOrdersPath, 'utf8');

// Update recordExecution in useOrders.ts
const oldRecordExecutionRegex = /const recordExecution = async \([\s\S]*?toast\(\{[\s\S]*?title: "Execução registrada",[\s\S]*?\}\);[\s\S]*?\} catch \(err: any\) \{[\s\S]*?\}\s*?\};/;

const newRecordExecutionCode = `const recordExecution = async (orderId: string, execution: {
    areaExecuted: number;
    notes?: string;
    collaboratorName?: string;
    collaborators?: string[];
    equipmentNames?: string[];
  }) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const totalArea = parseFloat(order.area) || 0;
      const previousExecuted = order.executedArea || 0;
      const newExecutedArea = Math.min(totalArea, previousExecuted + execution.areaExecuted);
      const percentage = totalArea > 0 ? (newExecutedArea / totalArea) * 100 : 100;

      const collabs = execution.collaborators || (execution.collaboratorName ? [execution.collaboratorName] : []);
      const equips = execution.equipmentNames || [];

      const newExecution: any = {
        id: crypto.randomUUID(),
        date: new Date().toISOString().split('T')[0],
        areaExecuted: execution.areaExecuted,
        hectares: execution.areaExecuted,
        percentage: Math.round(percentage * 100) / 100,
        notes: execution.notes,
        collaboratorName: collabs.join(', ') || execution.collaboratorName,
        collaborators: collabs,
        equipmentNames: equips,
        equipmentName: equips.join(', '),
        createdAt: new Date().toISOString()
      };

      const updatedExecutions = [...order.executions, newExecution];

      let newStatus = order.status;
      if (newExecutedArea >= totalArea && totalArea > 0) {
        newStatus = "Concluído";
      } else if (newExecutedArea > 0) {
        newStatus = "Em Andamento";
      }

      const teamStr = collabs.length > 0 ? collabs.join(', ') : (execution.collaboratorName || 'Não informado');
      const equipStr = equips.length > 0 ? equips.join(', ') : 'Padrão';
      const execLog = createLogEntry("Execução", \`Execução de \${execution.areaExecuted} ha registrada (\${percentage.toFixed(1)}% concluído). Equipe: \${teamStr}. Equipamentos: \${equipStr}. Obs: \${execution.notes || 'Sem observações'}\`);
      const updatedLogs = [...(order.logs || []), execLog];

      await updateOrder({
        ...order,
        executions: updatedExecutions,
        executedArea: newExecutedArea,
        status: newStatus,
        logs: updatedLogs
      });

      toast({
        title: "Execução registrada",
        description: \`Área executada: \${execution.areaExecuted} ha (Total: \${newExecutedArea}/\${totalArea} ha - \${percentage.toFixed(1)}%)\`,
      });
    } catch (err: any) {
      toast({
        title: "Erro ao registrar execução",
        description: err.message,
        variant: "destructive",
      });
    }
  };`;

// Update addSchedule in useOrders.ts
const oldAddScheduleRegex = /const addSchedule = async \([\s\S]*?toast\(\{[\s\S]*?title: "Agendamento registrado",[\s\S]*?\}\);[\s\S]*?\} catch \(err: any\) \{[\s\S]*?\}\s*?\};/;

const newAddScheduleCode = `const addSchedule = async (orderId: string, schedule: {
    scheduledDate: string;
    description: string;
    collaborators?: string[];
    equipmentNames?: string[];
  }) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const collabs = schedule.collaborators || [];
      const equips = schedule.equipmentNames || [];

      const newSchedule: any = {
        id: crypto.randomUUID(),
        scheduledDate: schedule.scheduledDate,
        date: schedule.scheduledDate,
        description: schedule.description,
        notes: schedule.description,
        collaborators: collabs,
        collaborator: collabs.join(', '),
        equipmentNames: equips,
        equipment: equips.join(', '),
        status: 'Agendado',
        createdAt: new Date().toISOString()
      };

      const updatedSchedules = [...order.schedules, newSchedule];

      const teamStr = collabs.length > 0 ? \` • Equipe: \${collabs.join(', ')}\` : '';
      const equipStr = equips.length > 0 ? \` • Equip: \${equips.join(', ')}\` : '';
      const schedLog = createLogEntry("Agendamento", \`Serviço agendado para \${schedule.scheduledDate}. Detalhes: \${schedule.description}\${teamStr}\${equipStr}\`);
      const updatedLogs = [...(order.logs || []), schedLog];

      await updateOrder({
        ...order,
        schedules: updatedSchedules,
        logs: updatedLogs
      });

      toast({
        title: "Agendamento registrado",
        description: \`Serviço agendado para \${schedule.scheduledDate}.\`,
      });
    } catch (err: any) {
      toast({
        title: "Erro ao agendar serviço",
        description: err.message,
        variant: "destructive",
      });
    }
  };`;

if (oldRecordExecutionRegex.test(useOrdersContent)) {
  useOrdersContent = useOrdersContent.replace(oldRecordExecutionRegex, newRecordExecutionCode);
}
if (oldAddScheduleRegex.test(useOrdersContent)) {
  useOrdersContent = useOrdersContent.replace(oldAddScheduleRegex, newAddScheduleCode);
}

fs.writeFileSync(path.join(frontendRoot, 'src/components/pages/orders/OrderScheduleDialog.tsx'), orderScheduleDialogCode);
fs.writeFileSync(path.join(frontendRoot, 'src/components/pages/orders/OrderExecutionDialog.tsx'), orderExecutionDialogCode);
fs.writeFileSync(useOrdersPath, useOrdersContent);

console.log('Successfully patched OrderScheduleDialog, OrderExecutionDialog, and useOrders!');
