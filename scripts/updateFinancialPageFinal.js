const fs = require('fs');

const code = `import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  AlertCircle,
  CreditCard,
  RotateCcw,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight
} from "lucide-react";
import { useOrders, Order } from "@/hooks/useOrders";
import { FinancialTransactionsTab } from "./financial/FinancialTransactionsTab";
import { OrderPaymentDialog } from "./orders/OrderPaymentDialog";

export const FinancialPage = () => {
  const { orders, loading, markOrderAsPaid } = useOrders();

  const [activeTab, setActiveTab] = useState<string>("pedidos");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filtros de Pedidos
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [farmFilter, setFarmFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");

  // State for Baixa Modal
  const [selectedOrderForBaixa, setSelectedOrderForBaixa] = useState<Order | null>(null);
  const [isBaixaModalOpen, setIsBaixaModalOpen] = useState(false);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Extrai listas únicas para filtros
  const uniqueClients = useMemo(() => Array.from(new Set(orders.map(o => o.client?.name || o.clientId))).filter(Boolean), [orders]);
  const uniqueFarms = useMemo(() => Array.from(new Set(orders.map(o => o.farm?.name || o.farmId))).filter(Boolean), [orders]);
  const uniqueServices = useMemo(() => Array.from(new Set(orders.map(o => o.serviceName || o.type))).filter(Boolean), [orders]);

  // Filtragem de pedidos
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (paymentFilter !== "all" && o.payment !== paymentFilter) return false;
      if (clientFilter !== "all" && (o.client?.name || o.clientId) !== clientFilter) return false;
      if (farmFilter !== "all" && (o.farm?.name || o.farmId) !== farmFilter) return false;
      if (serviceFilter !== "all" && (o.serviceName || o.type) !== serviceFilter) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const clientName = (o.client?.name || o.clientId || "").toLowerCase();
        const farmName = (o.farm?.name || o.farmId || "").toLowerCase();
        const service = (o.serviceName || o.type || "").toLowerCase();
        if (!clientName.includes(q) && !farmName.includes(q) && !service.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [orders, paymentFilter, clientFilter, farmFilter, serviceFilter, searchTerm]);

  // Totais de Pedidos
  const financialTotals = useMemo(() => {
    let totalGeral = 0;
    let totalRecebido = 0;
    let totalPendente = 0;

    orders.forEach(o => {
      const val = o.numericValue || 0;
      const paid = o.paidAmount || 0;
      totalGeral += val;
      totalRecebido += paid;
      totalPendente += Math.max(0, val - paid);
    });

    return { totalGeral, totalRecebido, totalPendente };
  }, [orders]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const handleOpenBaixa = (order: Order) => {
    setSelectedOrderForBaixa(order);
    setIsBaixaModalOpen(true);
  };

  const handleRecordPayment = async (orderId: string, payment: { amount: number; method: string; notes?: string }) => {
    await markOrderAsPaid(orderId, payment);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestão Financeira & Caixa</h1>
          <p className="text-sm text-muted-foreground">
            Controle de contas a receber de pedidos, baixas parciais e lançamentos de fluxo de caixa
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted p-1 border">
          <TabsTrigger value="pedidos" className="flex items-center gap-1.5 text-xs font-semibold">
            <DollarSign className="h-4 w-4" />
            Contas de Pedidos / Clientes ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="lancamentos" className="flex items-center gap-1.5 text-xs font-semibold">
            <Receipt className="h-4 w-4" />
            Lançamentos (Entradas & Saídas)
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: CONTAS DE PEDIDOS */}
        <TabsContent value="pedidos" className="space-y-4">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-primary shadow-xs">
              <CardHeader className="pb-2 pt-4">
                <CardDescription className="text-xs font-semibold uppercase">Total Faturado em Pedidos</CardDescription>
                <CardTitle className="text-xl font-bold text-foreground">{formatBRL(financialTotals.totalGeral)}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-[11px] text-muted-foreground">
                Soma de todos os pedidos cadastrados
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500 shadow-xs">
              <CardHeader className="pb-2 pt-4">
                <CardDescription className="text-xs font-semibold uppercase">Total Já Recebido</CardDescription>
                <CardTitle className="text-xl font-bold text-emerald-600">{formatBRL(financialTotals.totalRecebido)}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-[11px] text-muted-foreground">
                Pagamentos confirmados de clientes
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500 shadow-xs">
              <CardHeader className="pb-2 pt-4">
                <CardDescription className="text-xs font-semibold uppercase">Saldo Devedor / A Receber</CardDescription>
                <CardTitle className="text-xl font-bold text-amber-600">{formatBRL(financialTotals.totalPendente)}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-[11px] text-muted-foreground">
                Aguardando liquidação total ou parcial
              </CardContent>
            </Card>
          </div>

          {/* Filtros Expandidos de Pedidos */}
          <Card className="p-4 bg-muted/20 border">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              <div className="md:col-span-2">
                <Label className="text-xs font-semibold">Busca</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente, fazenda, serviço..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 text-xs bg-background h-8"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Status de Pagamento</Label>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="mt-1 text-xs bg-background h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="Aguardando">Aguardando Pagamento</SelectItem>
                    <SelectItem value="Parcial">Pago Parcialmente</SelectItem>
                    <SelectItem value="Pago">Totalmente Quitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Cliente</Label>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="mt-1 text-xs bg-background h-8">
                    <SelectValue placeholder="Todos os clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os clientes</SelectItem>
                    {uniqueClients.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Serviço</Label>
                <Select value={serviceFilter} onValueChange={setServiceFilter}>
                  <SelectTrigger className="mt-1 text-xs bg-background h-8">
                    <SelectValue placeholder="Todos os serviços" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os serviços</SelectItem>
                    {uniqueServices.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-between items-center mt-3 pt-2 border-t">
              <span className="text-xs text-muted-foreground">
                Exibindo <strong>{filteredOrders.length}</strong> de <strong>{orders.length}</strong> pedidos
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setPaymentFilter("all");
                  setClientFilter("all");
                  setFarmFilter("all");
                  setServiceFilter("all");
                }}
                className="text-xs h-7 flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Limpar Filtros
              </Button>
            </div>
          </Card>

          {/* Tabela de Pedidos Financeiros */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente / Fazenda</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Já Quitado</TableHead>
                      <TableHead>Saldo Devedor</TableHead>
                      <TableHead>Status Pagamento</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                          Nenhum pedido encontrado com os filtros selecionados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedOrders.map((order) => {
                        const total = order.numericValue || 0;
                        const paid = order.paidAmount || 0;
                        const remaining = Math.max(0, total - paid);

                        return (
                          <TableRow key={order.id} className="hover:bg-muted/40">
                            <TableCell>
                              <div className="font-semibold text-foreground text-sm">
                                {order.client?.name || order.clientId}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {order.farm?.name || order.farmId}
                              </div>
                            </TableCell>

                            <TableCell className="text-xs font-medium">
                              {order.serviceName || order.type}
                            </TableCell>

                            <TableCell className="text-xs font-semibold">
                              {formatBRL(total)}
                            </TableCell>

                            <TableCell className="text-xs text-emerald-700 font-semibold">
                              {formatBRL(paid)}
                            </TableCell>

                            <TableCell className="text-xs font-bold text-amber-700">
                              {remaining > 0 ? formatBRL(remaining) : <span className="text-emerald-600 font-normal">Quitado</span>}
                            </TableCell>

                            <TableCell>
                              <Badge
                                className={\`text-xs \${
                                  order.payment === "Pago"
                                    ? "bg-green-100 text-green-800"
                                    : order.payment === "Parcial"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-800"
                                }\`}
                              >
                                {order.payment}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() => handleOpenBaixa(order)}
                                className={\`text-xs h-8 \${
                                  remaining <= 0
                                    ? "bg-muted text-muted-foreground hover:bg-muted/80"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                }\`}
                              >
                                <DollarSign className="h-3.5 w-3.5 mr-1" />
                                {remaining <= 0 ? "Ver Histórico" : "Dar Baixa"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="p-3 border-t flex justify-end">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <span className="text-xs text-muted-foreground px-3">
                          Página {currentPage} de {totalPages}
                        </span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 2: LANÇAMENTOS (FLUXO DE CAIXA COMPLETO) */}
        <TabsContent value="lancamentos">
          <FinancialTransactionsTab />
        </TabsContent>
      </Tabs>

      {/* MODAL UNIVERSAL DE BAIXA FINANCEIRA COM MÁSCARA MONETÁRIA E CÁLCULO DE SALDO */}
      <OrderPaymentDialog
        order={selectedOrderForBaixa}
        open={isBaixaModalOpen}
        onOpenChange={setIsBaixaModalOpen}
        onRecordPayment={handleRecordPayment}
      />
    </div>
  );
};

export default FinancialPage;
`;

fs.writeFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/FinancialPage.tsx', code, 'utf8');
console.log('Successfully updated FinancialPage.tsx with tabs, expanded filters, and Lançamentos cash flow integration!');
