const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/FinancialPage.tsx');

const financialCode = `import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Clock, CheckCircle2, Search, Filter, AlertCircle, CreditCard, Sparkles } from "lucide-react";
import { useOrders, Order } from "@/hooks/useOrders";

const FinancialPage = () => {
  const { orders, loading, markOrderAsPaid } = useOrders();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");

  // State for Baixa Modal
  const [selectedOrderForBaixa, setSelectedOrderForBaixa] = useState<Order | null>(null);
  const [baixaAmount, setBaixaAmount] = useState<string>("");
  const [baixaMethod, setBaixaMethod] = useState<string>("PIX");
  const [baixaNotes, setBaixaNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Financial statistics
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let pendingPayments = 0;
    let waitingCount = 0;
    let completedAwaitingPaymentCount = 0;

    orders.forEach((o) => {
      const val = o.numericValue || 0;
      const paid = o.paidAmount || 0;

      totalRevenue += paid;
      const remaining = Math.max(0, val - paid);
      pendingPayments += remaining;

      if (o.payment === "Aguardando" || !o.payment) {
        waitingCount++;
      }
      if (o.status === "Concluído" && o.payment !== "Pago") {
        completedAwaitingPaymentCount++;
      }
    });

    return {
      totalRevenue,
      pendingPayments,
      totalGeneral: totalRevenue + pendingPayments,
      waitingCount,
      completedAwaitingPaymentCount,
    };
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const clientName = o.client?.name || "";
      const farmName = o.farm?.name || "";
      const serviceName = o.serviceName || o.type || "";

      const matchesSearch =
        clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        farmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        serviceName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPayment =
        paymentFilter === "all" ||
        (paymentFilter === "ConcluidoPendente" ? o.status === "Concluído" && o.payment !== "Pago" : o.payment === paymentFilter);

      return matchesSearch && matchesPayment;
    });
  }, [orders, searchTerm, paymentFilter]);

  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const handleOpenBaixa = (order: Order) => {
    const total = order.numericValue || 0;
    const paid = order.paidAmount || 0;
    const remaining = Math.max(0, total - paid);

    setSelectedOrderForBaixa(order);
    setBaixaAmount(remaining.toString());
    setBaixaMethod("PIX");
    setBaixaNotes("");
  };

  const handleConfirmBaixa = async () => {
    if (!selectedOrderForBaixa) return;
    const amount = parseFloat(baixaAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Por favor, informe um valor válido para a baixa.");
      return;
    }

    setIsSubmitting(true);
    try {
      await markOrderAsPaid(selectedOrderForBaixa.id, {
        amount,
        method: baixaMethod,
        notes: baixaNotes,
      });
      setSelectedOrderForBaixa(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatBRL = (val: number) => {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-sm text-muted-foreground">
            Controle de recebimentos, fluxo de caixa e baixa de pagamentos
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        <Card className="shadow-sm border-l-4 border-l-green-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Recebido</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-700">
              {formatBRL(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total já quitado no sistema</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas a Receber</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-orange-600">
              {formatBRL(stats.pendingPayments)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.waitingCount} pedidos com saldo em aberto
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-blue-600 sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Total Negociado</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-700">
              {formatBRL(stats.totalGeneral)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completedAwaitingPaymentCount > 0
                ? \`\${stats.completedAwaitingPaymentCount} pedidos concluídos aguardando baixa\`
                : "Todos os pedidos registrados"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg sm:text-xl">Extrato de Pedidos & Cobranças</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Lista consolidada para conferência financeira e baixa manual
              </CardDescription>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente ou serviço..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8 text-sm h-9"
                />
              </div>

              <Select
                value={paymentFilter}
                onValueChange={(val) => {
                  setPaymentFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-44 h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Status Financeiro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Pagamentos</SelectItem>
                  <SelectItem value="Aguardando">Aguardando Pagamento</SelectItem>
                  <SelectItem value="Parcial">Pagamento Parcial</SelectItem>
                  <SelectItem value="Pago">Totalmente Pago</SelectItem>
                  <SelectItem value="ConcluidoPendente">Concluído (Não Pago)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Carregando dados financeiros...</div>
          ) : currentOrders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground space-y-2">
              <AlertCircle className="h-8 w-8 mx-auto text-slate-400" />
              <p className="text-sm font-medium">Nenhum registro financeiro encontrado</p>
              <p className="text-xs">Altere os filtros de busca para visualizar os lançamentos</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <Table className="min-w-[700px] w-full text-xs sm:text-sm">
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold">Cliente</TableHead>
                    <TableHead className="font-semibold">Fazenda</TableHead>
                    <TableHead className="font-semibold">Serviço</TableHead>
                    <TableHead className="font-semibold text-right">Valor Total</TableHead>
                    <TableHead className="font-semibold text-right">Valor Pago</TableHead>
                    <TableHead className="font-semibold text-right">Saldo</TableHead>
                    <TableHead className="font-semibold text-center">Status</TableHead>
                    <TableHead className="font-semibold text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentOrders.map((order) => {
                    const total = order.numericValue || 0;
                    const paid = order.paidAmount || 0;
                    const remaining = Math.max(0, total - paid);
                    const isFullyPaid = order.payment === "Pago" || (paid >= total && total > 0);

                    return (
                      <TableRow key={order.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium text-slate-900">
                          {order.client?.name || "Cliente"}
                        </TableCell>
                        <TableCell className="text-slate-700">{order.farm?.name || "Fazenda"}</TableCell>
                        <TableCell className="text-slate-700">{order.serviceName || order.type}</TableCell>
                        <TableCell className="text-right font-medium text-slate-900">
                          {formatBRL(total)}
                        </TableCell>
                        <TableCell className="text-right text-emerald-700 font-medium">
                          {formatBRL(paid)}
                        </TableCell>
                        <TableCell className={\`text-right font-semibold \${remaining > 0 ? "text-orange-600" : "text-slate-400"}\`}>
                          {formatBRL(remaining)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={\`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold \${
                              isFullyPaid
                                ? "bg-green-100 text-green-800"
                                : order.payment === "Parcial"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-orange-100 text-orange-800"
                            }\`}
                          >
                            {isFullyPaid ? "Pago" : order.payment === "Parcial" ? "Parcial" : "Aguardando"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {isFullyPaid ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled
                              className="h-8 px-2 text-xs text-green-700"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Quitado
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                              onClick={() => handleOpenBaixa(order)}
                            >
                              <DollarSign className="h-3.5 w-3.5 mr-1" /> Dar Baixa
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t text-xs text-muted-foreground">
            <div>
              Mostrando {totalItems > 0 ? startIndex + 1 : 0} a {Math.min(endIndex, totalItems)} de {totalItems} lançamentos
            </div>
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal: Dar Baixa / Registrar Pagamento */}
      <Dialog open={!!selectedOrderForBaixa} onOpenChange={(open) => !open && setSelectedOrderForBaixa(null)}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Dar Baixa no Pedido
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Registre a liquidação financeira total ou parcial com atualização imediata no banco
            </DialogDescription>
          </DialogHeader>

          {selectedOrderForBaixa && (
            <div className="space-y-4 my-2 text-xs sm:text-sm">
              <div className="p-3 bg-slate-50 border rounded-lg space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-semibold text-slate-800">{selectedOrderForBaixa.client?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Serviço:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedOrderForBaixa.serviceName || selectedOrderForBaixa.type}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-1 mt-1">
                  <span className="text-muted-foreground">Valor Total:</span>
                  <span className="font-bold text-slate-900">
                    {formatBRL(selectedOrderForBaixa.numericValue || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-orange-600 font-semibold">
                  <span>Saldo a Pagar:</span>
                  <span>
                    {formatBRL(
                      Math.max(
                        0,
                        (selectedOrderForBaixa.numericValue || 0) - (selectedOrderForBaixa.paidAmount || 0)
                      )
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="baixa-val">Valor a Liquidar (R$)</Label>
                <Input
                  id="baixa-val"
                  type="number"
                  step="0.01"
                  value={baixaAmount}
                  onChange={(e) => setBaixaAmount(e.target.value)}
                  placeholder="0,00"
                  className="font-bold text-base"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="baixa-metodo">Método de Pagamento</Label>
                <Select value={baixaMethod} onValueChange={setBaixaMethod}>
                  <SelectTrigger id="baixa-metodo">
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Boleto">Boleto Bancário</SelectItem>
                    <SelectItem value="Depósito">Depósito / Transferência</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Cartão">Cartão Débito/Crédito</SelectItem>
                    <SelectItem value="Safra">Safra / Barter (Grãos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="baixa-obs">Observações / Comprovante (opcional)</Label>
                <Input
                  id="baixa-obs"
                  value={baixaNotes}
                  onChange={(e) => setBaixaNotes(e.target.value)}
                  placeholder="Ex: Ref. TED Banco do Brasil"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-2">
            <Button variant="outline" onClick={() => setSelectedOrderForBaixa(null)}>
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              onClick={handleConfirmBaixa}
              disabled={isSubmitting}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              {isSubmitting ? "Gravando..." : "Confirmar Baixa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancialPage;
`;

fs.writeFileSync(targetPath, financialCode, 'utf8');
console.log('✅ FinancialPage.tsx patched to 100% backend API + Baixa de Pagamento + Responsiveness!');
