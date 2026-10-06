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
import { Calendar, Plus, Clock, Users, Wrench, X, CheckCircle2 } from 'lucide-react';
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

  // Local state for instant reactive UI updates
  const [schedulesList, setSchedulesList] = useState<any[]>(order?.schedules || []);

  useEffect(() => {
    if (order?.schedules) {
      setSchedulesList(order.schedules);
    }
  }, [order?.schedules]);

  useEffect(() => {
    if (open) {
      fetchOptions();
      if (order?.schedules) {
        setSchedulesList(order.schedules);
      }
    }
  }, [open, order]);

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

    const newScheduleItem = {
      id: crypto.randomUUID(),
      scheduledDate,
      date: scheduledDate,
      description: description.trim(),
      notes: description.trim(),
      collaborators: selectedCollaborators,
      equipmentNames: selectedEquipment,
      status: 'Agendado',
      createdAt: new Date().toISOString()
    };

    // Immediate reactive local update so the screen updates instantly
    setSchedulesList(prev => [...prev, newScheduleItem]);
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
    } catch (err) {
      // Revert if error
      setSchedulesList(order.schedules || []);
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
              {submitting ? 'Salvando...' : 'Adicionar Agendamento'}
            </Button>
          </form>

          {/* Lista de agendamentos */}
          <div className="space-y-2">
            <Label className="font-semibold text-xs flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Agendamentos do Pedido ({schedulesList.length}):
            </Label>

            {schedulesList.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground border border-dashed rounded">
                Nenhum agendamento registrado ainda.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2">
                {schedulesList.map((sc: any, idx) => (
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
                          <Badge key={i} variant="secondary" className="text-[10px] py-0 px-1 bg-blue-50 text-blue-700 font-normal">
                            {c}
                          </Badge>
                        ))}
                        {sc.equipmentNames?.map((eq: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px] py-0 px-1 font-normal">
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

// 2. Update OrdersTable.tsx to always pass the fresh active order
const ordersTablePath = path.join(frontendRoot, 'src/components/pages/orders/OrdersTable.tsx');
let ordersTableContent = fs.readFileSync(ordersTablePath, 'utf8');

// Insert active order resolution right before lifecycle modals or in render
const activeOrdersBlock = `
  // Resolução dinâmica do pedido sempre atualizado para os modais
  const activeOrderForSched = selectedOrderForSched
    ? orders.find((o) => o.id === selectedOrderForSched.id) || selectedOrderForSched
    : null;

  const activeOrderForExec = selectedOrderForExec
    ? orders.find((o) => o.id === selectedOrderForExec.id) || selectedOrderForExec
    : null;

  const activeOrderForPay = selectedOrderForPay
    ? orders.find((o) => o.id === selectedOrderForPay.id) || selectedOrderForPay
    : null;

  const activeOrderForPrint = selectedOrderForPrint
    ? orders.find((o) => o.id === selectedOrderForPrint.id) || selectedOrderForPrint
    : null;
`;

if (!ordersTableContent.includes('activeOrderForSched')) {
  ordersTableContent = ordersTableContent.replace(
    '{/* Lifecycle Modals */}',
    activeOrdersBlock + '\n        {/* Lifecycle Modals */}'
  );

  ordersTableContent = ordersTableContent.replace(
    'order={selectedOrderForSched}',
    'order={activeOrderForSched}'
  );
  ordersTableContent = ordersTableContent.replace(
    'order={selectedOrderForExec}',
    'order={activeOrderForExec}'
  );
  ordersTableContent = ordersTableContent.replace(
    'order={selectedOrderForPay}',
    'order={activeOrderForPay}'
  );
  ordersTableContent = ordersTableContent.replace(
    'order={selectedOrderForPrint}',
    'order={activeOrderForPrint}'
  );
}

// 3. Update useOrders.ts to optimistically update `orders` state
const useOrdersPath = path.join(frontendRoot, 'src/hooks/useOrders.ts');
let useOrdersContent = fs.readFileSync(useOrdersPath, 'utf8');

// Optimistic update in addSchedule
const addScheduleRegex = /const addSchedule = async \([\s\S]*?toast\(\{[\s\S]*?title: "Agendamento registrado",[\s\S]*?\}\);[\s\S]*?\} catch \(err: any\) \{[\s\S]*?\}\s*?\};/;

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

      // Optimistic update in local state for immediate UI feedback
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        schedules: updatedSchedules,
        logs: updatedLogs
      } : o));

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

if (addScheduleRegex.test(useOrdersContent)) {
  useOrdersContent = useOrdersContent.replace(addScheduleRegex, newAddScheduleCode);
}

fs.writeFileSync(path.join(frontendRoot, 'src/components/pages/orders/OrderScheduleDialog.tsx'), orderScheduleDialogCode);
fs.writeFileSync(ordersTablePath, ordersTableContent);
fs.writeFileSync(useOrdersPath, useOrdersContent);

console.log('Successfully applied instant screen update for OrderScheduleDialog, OrdersTable, and useOrders!');
