const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/orders/OrderHistoryDialog.tsx');

const componentCode = `import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  History,
  User,
  Clock,
  CheckCircle2,
  Play,
  Calendar,
  DollarSign,
  Ban,
  Edit,
  ShieldCheck,
  FileText
} from "lucide-react";
import { Order, OrderActionLog } from "@/hooks/useOrders";

interface OrderHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

export const OrderHistoryDialog: React.FC<OrderHistoryDialogProps> = ({
  open,
  onOpenChange,
  order,
}) => {
  if (!order) return null;

  const logs: OrderActionLog[] = Array.isArray(order.logs) ? order.logs : [];

  const getActionBadge = (action: string) => {
    switch (action.toLowerCase()) {
      case 'criação':
      case 'criado':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100"><ShieldCheck className="w-3 h-3 mr-1" /> Criação</Badge>;
      case 'aprovação':
      case 'aprovado':
        return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Aprovação</Badge>;
      case 'execução':
      case 'execução parcial':
      case 'concluído':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100"><Play className="w-3 h-3 mr-1" /> Execução</Badge>;
      case 'agendamento':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100"><Calendar className="w-3 h-3 mr-1" /> Agendamento</Badge>;
      case 'pagamento':
      case 'baixa financeira':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100"><DollarSign className="w-3 h-3 mr-1" /> Financeiro</Badge>;
      case 'edição':
      case 'editado':
        return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-100"><Edit className="w-3 h-3 mr-1" /> Edição</Badge>;
      case 'cancelamento':
      case 'cancelado':
        return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100"><Ban className="w-3 h-3 mr-1" /> Cancelamento</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
              <History className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Histórico de Ações do Pedido</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Auditoria completa de todas as alterações e responsáveis pela operação
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Order Summary Header */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border rounded-lg text-xs">
          <div>
            <span className="text-muted-foreground block">Cliente:</span>
            <span className="font-semibold text-slate-800">{order.client?.name || 'Cliente'}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Fazenda:</span>
            <span className="font-semibold text-slate-800">{order.farm?.name || 'Fazenda'}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Serviço:</span>
            <span className="font-semibold text-slate-800">{order.serviceName || order.type}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Valor Atual:</span>
            <span className="font-semibold text-green-700">{order.value}</span>
          </div>
        </div>

        {/* Timeline Content */}
        <ScrollArea className="flex-1 pr-4 my-2">
          {logs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground space-y-2">
              <FileText className="h-8 w-8 mx-auto text-slate-400" />
              <p className="text-sm font-medium">Histórico inicial gerado automaticamente</p>
              <p className="text-xs">
                Pedido criado em {formatDate(order.createdAt)} • Status atual: {order.status}
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {logs.map((log, index) => (
                <div key={log.id || index} className="relative flex flex-col gap-1 text-sm">
                  {/* Timeline dot */}
                  <div className="absolute -left-[1.85rem] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-primary" />

                  <div className="flex flex-wrap items-center gap-2">
                    {getActionBadge(log.action)}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(log.timestamp)}
                    </span>
                  </div>

                  <div className="mt-1 bg-white border rounded-md p-3 shadow-sm">
                    <p className="text-slate-800 font-medium text-sm">
                      {log.details || log.action}
                    </p>
                    <div className="mt-2 pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        {log.userName || 'Sistema'}
                      </span>
                      <span className="text-slate-400">ID: {log.id ? log.id.slice(0, 8) : String(index + 1)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
`;

fs.writeFileSync(targetPath, componentCode, 'utf8');
console.log('✅ OrderHistoryDialog.tsx created successfully!');
