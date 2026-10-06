const fs = require('fs');

const paymentDialogCode = `import React, { useState, useEffect, useMemo } from 'react';
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
import { DollarSign, CheckCircle2, History, AlertCircle, ArrowDownLeft } from 'lucide-react';

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
  const [displayAmount, setDisplayAmount] = useState<string>('');
  const [method, setMethod] = useState<string>('PIX');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const totalValue = order?.numericValue || 0;
  const paidAmount = order?.paidAmount || 0;
  const remainingAmount = Math.max(0, totalValue - paidAmount);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Inicializa o valor com o saldo restante formatado
  useEffect(() => {
    if (order && open) {
      if (remainingAmount > 0) {
        setDisplayAmount(remainingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      } else {
        setDisplayAmount('');
      }
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [order, open, remainingAmount]);

  const parsedAmount = useMemo(() => {
    const clean = displayAmount.replace(/[R$\s.]/g, '').replace(',', '.');
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
  }, [displayAmount]);

  const projectedRemaining = Math.max(0, remainingAmount - parsedAmount);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\\D/g, '');
    if (!v) {
      setDisplayAmount('');
      return;
    }
    const num = parseInt(v) / 100;
    setDisplayAmount(num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const handleConfirm = async () => {
    if (!order || parsedAmount <= 0) return;

    setSubmitting(true);
    try {
      await onRecordPayment(order.id, {
        amount: parsedAmount,
        method,
        notes: notes.trim() || undefined,
      });

      // SINCRONIZAÇÃO AUTOMÁTICA COM LANÇAMENTOS FINANCEIROS (FLUXO DE CAIXA)
      try {
        const STORAGE_KEY = 'farm_flow_financial_transactions_v2';
        const stored = localStorage.getItem(STORAGE_KEY);
        const list = stored ? JSON.parse(stored) : [];
        const newTx = {
          id: "tx-order-" + Date.now(),
          type: "income",
          category: "Serviços Agrícolas",
          amount: parsedAmount,
          description: \`Recebimento Pedido #\${order.id.slice(0, 8)} - \${order.client?.name || order.clientId}\`,
          dueDate: paymentDate,
          paidDate: paymentDate,
          status: "paid",
          clientOrSupplier: order.client?.name || order.clientId,
          orderId: order.id,
          paymentMethod: method,
          notes: notes.trim() || \`Baixa financeira (\${order.serviceName || order.type})\`,
          createdAt: new Date().toISOString()
        };
        list.unshift(newTx);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch (e) {
        console.warn('Erro ao salvar no fluxo de caixa:', e);
      }

      setDisplayAmount('');
      setNotes('');
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            Dar Baixa no Pedido / Cobrança
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Card Resumo Financeiro */}
          <div className="p-3 border rounded-lg bg-muted/30 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cliente / Fazenda:</span>
              <span className="font-semibold text-foreground">
                {order.client?.name || order.clientId} • {order.farm?.name || order.farmId}
              </span>
            </div>
            <div className="flex justify-between border-t pt-1.5">
              <span className="text-muted-foreground">Valor Total do Pedido:</span>
              <strong>{formatBRL(totalValue)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Já Quitado:</span>
              <strong className="text-emerald-700">{formatBRL(paidAmount)}</strong>
            </div>
            <div className="flex justify-between font-bold text-amber-700 bg-amber-50/80 p-1.5 rounded">
              <span>Saldo Devedor Atual:</span>
              <span>{formatBRL(remainingAmount)}</span>
            </div>
          </div>

          {remainingAmount <= 0 ? (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-sm flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Este pedido já foi 100% quitado!
            </div>
          ) : (
            <div className="space-y-3">
              {/* Input com máscara monetária */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label htmlFor="pay-amount-masked" className="text-xs font-semibold">
                    Valor Deste Pagamento (R$):
                  </Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDisplayAmount((remainingAmount / 2).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
                      className="text-[11px] text-muted-foreground hover:text-foreground font-medium"
                    >
                      50% ({formatBRL(remainingAmount / 2)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDisplayAmount(remainingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
                      className="text-[11px] text-emerald-600 hover:underline font-semibold"
                    >
                      Quitar Saldo Total
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">R$</span>
                  <Input
                    id="pay-amount-masked"
                    value={displayAmount}
                    onChange={handleAmountChange}
                    placeholder="0,00"
                    className="pl-9 font-bold text-base text-foreground"
                    autoFocus
                  />
                </div>

                {/* Previsão do Saldo Restante */}
                <div className="mt-1.5 flex justify-between items-center text-xs p-1.5 rounded bg-muted/40 border">
                  <span className="text-muted-foreground">Saldo Restante Após Esta Baixa:</span>
                  <strong className={projectedRemaining === 0 ? "text-emerald-600" : "text-amber-600"}>
                    {formatBRL(projectedRemaining)} {projectedRemaining === 0 ? "(Quitado)" : "(Parcial)"}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="pay-date" className="text-xs font-semibold">Data do Recebimento:</Label>
                  <Input
                    id="pay-date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="pay-method" className="text-xs font-semibold">Forma de Pagamento:</Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger id="pay-method" className="mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Boleto">Boleto Bancário</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="Transferência">Transferência Bancária</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro / Carteira</SelectItem>
                      <SelectItem value="Cartão">Cartão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="pay-notes" className="text-xs font-semibold">Observações / Comprovante (Opcional):</Label>
                <Input
                  id="pay-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: 1ª parcela via PIX, comprovante enviado"
                  className="mt-1 text-xs"
                />
              </div>
            </div>
          )}

          {/* Histórico de Recebimentos */}
          {order.payments && order.payments.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t text-xs">
              <Label className="font-semibold flex items-center gap-1 text-muted-foreground">
                <History className="h-3.5 w-3.5" />
                Histórico de Recebimentos ({order.payments.length}):
              </Label>
              <div className="max-h-28 overflow-y-auto space-y-1">
                {order.payments.map((p, idx) => (
                  <div key={p.id || idx} className="p-2 bg-muted/40 rounded flex justify-between items-center text-[11px]">
                    <div>
                      <span className="font-semibold">{p.date}</span>: {formatBRL(p.amount)} ({p.method})
                      {p.notes && <div className="text-muted-foreground italic text-[10px]">{p.notes}</div>}
                    </div>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {remainingAmount > 0 && (
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleConfirm}
              disabled={submitting || parsedAmount <= 0}
            >
              Confirmar Recebimento ({formatBRL(parsedAmount)})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
`;

fs.writeFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/orders/OrderPaymentDialog.tsx', paymentDialogCode, 'utf8');
console.log('Successfully updated OrderPaymentDialog.tsx with masked currency and remaining balance calculation!');
