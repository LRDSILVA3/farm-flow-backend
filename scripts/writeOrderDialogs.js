const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/orders');

// 1. OrderExecutionDialog.tsx
const executionDialogContent = `import React, { useState } from 'react';
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
import { Order } from '@/hooks/useOrders';
import { CheckCircle2, Play, History, Calendar } from 'lucide-react';

interface OrderExecutionDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecordExecution: (orderId: string, execution: { areaExecuted: number; notes?: string; collaboratorName?: string }) => Promise<void>;
}

export const OrderExecutionDialog: React.FC<OrderExecutionDialogProps> = ({
  order,
  open,
  onOpenChange,
  onRecordExecution,
}) => {
  const [executionType, setExecutionType] = useState<'total' | 'partial'>('total');
  const [partialArea, setPartialArea] = useState<string>('');
  const [collaborator, setCollaborator] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  if (!order) return null;

  const totalArea = parseFloat(order.area) || 0;
  const executedArea = order.executedArea || 0;
  const remainingArea = Math.max(0, totalArea - executedArea);
  const percentExecuted = totalArea > 0 ? (executedArea / totalArea) * 100 : 0;

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
        collaboratorName: collaborator.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onOpenChange(false);
      // Reset
      setPartialArea('');
      setNotes('');
      setCollaborator('');
      setExecutionType('total');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
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

              <div>
                <Label htmlFor="collaborator" className="text-xs">
                  Operador / Responsável Técnico (opcional):
                </Label>
                <Input
                  id="collaborator"
                  value={collaborator}
                  onChange={(e) => setCollaborator(e.target.value)}
                  placeholder="Nome do operador em campo"
                />
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
              <div className="max-h-32 overflow-y-auto space-y-1">
                {order.executions.map((ex, idx) => (
                  <div key={ex.id || idx} className="p-2 bg-muted/40 rounded flex justify-between items-center text-[11px]">
                    <div>
                      <span className="font-medium">{ex.date}</span>: {ex.areaExecuted} ha ({ex.percentage}%)
                      {ex.collaboratorName && <span className="text-muted-foreground"> • Op: {ex.collaboratorName}</span>}
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

fs.writeFileSync(path.join(targetDir, 'OrderExecutionDialog.tsx'), executionDialogContent, 'utf-8');
console.log('Created OrderExecutionDialog.tsx');

// 2. OrderScheduleDialog.tsx
const scheduleDialogContent = `import React, { useState } from 'react';
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
import { Order } from '@/hooks/useOrders';
import { Calendar, Plus, Clock, CheckCircle2 } from 'lucide-react';

interface OrderScheduleDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSchedule: (orderId: string, schedule: { scheduledDate: string; description: string }) => Promise<void>;
}

export const OrderScheduleDialog: React.FC<OrderScheduleDialogProps> = ({
  order,
  open,
  onOpenChange,
  onAddSchedule,
}) => {
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  if (!order) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDate || !description.trim()) return;

    setSubmitting(true);
    try {
      await onAddSchedule(order.id, {
        scheduledDate,
        description: description.trim(),
      });
      setScheduledDate('');
      setDescription('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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
            <Label className="font-semibold text-xs block">Novo Agendamento / Etapa:</Label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label htmlFor="sched-date" className="text-xs">Data:</Label>
                <Input
                  id="sched-date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="sched-desc" className="text-xs">Etapa / Descrição:</Label>
                <Input
                  id="sched-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: 1ª Visita de Coleta"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              size="sm"
              className="w-full bg-green-600 hover:bg-green-700 mt-1"
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
                {order.schedules.map((sc, idx) => (
                  <div
                    key={sc.id || idx}
                    className="p-2.5 border rounded-md bg-muted/20 flex justify-between items-center text-xs"
                  >
                    <div>
                      <div className="font-semibold">{sc.scheduledDate}</div>
                      <div className="text-muted-foreground">{sc.description}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-medium">
                      {sc.status || 'Agendado'}
                    </span>
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

fs.writeFileSync(path.join(targetDir, 'OrderScheduleDialog.tsx'), scheduleDialogContent, 'utf-8');
console.log('Created OrderScheduleDialog.tsx');

// 3. OrderPaymentDialog.tsx
const paymentDialogContent = `import React, { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Order } from '@/hooks/useOrders';
import { DollarSign, CheckCircle2, CreditCard, History } from 'lucide-react';

interface OrderPaymentDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecordPayment: (orderId: string, payment: { amount: number; method: string; notes?: string }) => Promise<void>;
}

export const OrderPaymentDialog: React.FC<OrderPaymentDialogProps> = ({
  order,
  open,
  onOpenChange,
  onRecordPayment,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<string>('PIX');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  if (!order) return null;

  const totalValue = order.numericValue || 0;
  const paidAmount = order.paidAmount || 0;
  const remainingAmount = Math.max(0, totalValue - paidAmount);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleConfirm = async () => {
    const payVal = parseFloat(amount) || 0;
    if (payVal <= 0) return;

    setSubmitting(true);
    try {
      await onRecordPayment(order.id, {
        amount: payVal,
        method,
        notes: notes.trim() || undefined,
      });
      setAmount('');
      setNotes('');
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-primary" />
            Cobrança e Registro de Pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status Financeiro */}
          <div className="p-3 border rounded-md bg-muted/30 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cliente / Fazenda:</span>
              <span className="font-semibold">{order.client?.name || order.clientId} • {order.farm?.name || order.farmId}</span>
            </div>
            <div className="flex justify-between border-t pt-1">
              <span className="text-muted-foreground">Valor Total do Pedido:</span>
              <strong>{formatBRL(totalValue)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Já Pago:</span>
              <strong className="text-green-700">{formatBRL(paidAmount)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Saldo a Receber:</span>
              <strong className="text-amber-700">{formatBRL(remainingAmount)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status Atual:</span>
              <span className="font-semibold text-primary">{order.payment}</span>
            </div>
          </div>

          {remainingAmount <= 0 ? (
            <div className="p-3 bg-green-50 text-green-800 border border-green-200 rounded-md text-sm flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Este pedido já foi totalmente quitado!
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label htmlFor="pay-amount" className="text-xs">Valor do Pagamento (R$):</Label>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-primary"
                    onClick={() => setAmount(remainingAmount.toFixed(2))}
                  >
                    Quitar Total ({formatBRL(remainingAmount)})
                  </Button>
                </div>
                <Input
                  id="pay-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remainingAmount}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={'Ex: ' + remainingAmount.toFixed(2)}
                />
              </div>

              <div>
                <Label htmlFor="pay-method" className="text-xs">Forma de Pagamento:</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger id="pay-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Boleto">Boleto Bancário</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Transferência">Transferência Bancária (TED/DOC)</SelectItem>
                    <SelectItem value="Carteira / Dinheiro">Carteira / Dinheiro</SelectItem>
                    <SelectItem value="Cartão">Cartão</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="pay-notes" className="text-xs">Observações / Comprovante (opcional):</Label>
                <Input
                  id="pay-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Pago 1ª parcela via PIX"
                />
              </div>
            </div>
          )}

          {/* Histórico de pagamentos */}
          {order.payments && order.payments.length > 0 && (
            <div className="space-y-1 pt-2 border-t text-xs">
              <Label className="font-semibold flex items-center gap-1 text-muted-foreground">
                <History className="h-3.5 w-3.5" />
                Histórico de Recebimentos ({order.payments.length}):
              </Label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {order.payments.map((p, idx) => (
                  <div key={p.id || idx} className="p-2 bg-muted/40 rounded flex justify-between items-center text-[11px]">
                    <div>
                      <span className="font-medium">{p.date}</span>: {formatBRL(p.amount)} ({p.method})
                      {p.notes && <div className="text-muted-foreground italic text-[10px]">{p.notes}</div>}
                    </div>
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
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
          {remainingAmount > 0 && (
            <Button
              type="button"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleConfirm}
              disabled={submitting || !amount || parseFloat(amount) <= 0}
            >
              Confirmar Recebimento
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
`;

fs.writeFileSync(path.join(targetDir, 'OrderPaymentDialog.tsx'), paymentDialogContent, 'utf-8');
console.log('Created OrderPaymentDialog.tsx');
