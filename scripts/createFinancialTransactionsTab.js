const fs = require('fs');

const code = `import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  Tag,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  dueDate: string;       // Data a Pagar / a Receber
  paidDate?: string;     // Data efetiva de Pagamento / Recebimento
  status: 'pending' | 'paid';
  clientOrSupplier?: string;
  orderId?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
}

const DEFAULT_INCOME_CATEGORIES = [
  "Serviços Agrícolas",
  "Venda de Insumos / Produtos",
  "Consultoria Agronômica",
  "Rendimento de Aplicação",
  "Outras Receitas"
];

const DEFAULT_EXPENSE_CATEGORIES = [
  "Combustível e Lubrificantes",
  "Manutenção de Equipamentos e Maquinário",
  "Diárias e Alimentação de Campo",
  "Folha e Prestadores",
  "Insumos e Peças",
  "Aluguel / Logística",
  "Impostos e Taxas",
  "Outras Despesas"
];

const STORAGE_KEY = 'farm_flow_financial_transactions_v2';

export const FinancialTransactionsTab: React.FC = () => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modal Novo Lançamento
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    category: DEFAULT_EXPENSE_CATEGORIES[0],
    amount: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    paidDate: new Date().toISOString().split('T')[0],
    status: 'paid' as 'pending' | 'paid',
    clientOrSupplier: '',
    paymentMethod: 'PIX',
    notes: ''
  });

  // Carrega transações salvas ou gera exemplos iniciais
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTransactions(JSON.parse(stored));
        return;
      }
    } catch {}

    // Exemplos iniciais realistas
    const initial: FinancialTransaction[] = [
      {
        id: "tx-1",
        type: "income",
        category: "Serviços Agrícolas",
        amount: 19320.34,
        description: "Recebimento Entrada - Amostragem de Solo Fazenda Santa Maria",
        dueDate: "2026-10-01",
        paidDate: "2026-10-01",
        status: "paid",
        clientOrSupplier: "João da Silva",
        paymentMethod: "PIX",
        createdAt: new Date().toISOString()
      },
      {
        id: "tx-2",
        type: "expense",
        category: "Combustível e Lubrificantes",
        amount: 850.00,
        description: "Abastecimento Quadriciclos ATV e Caminhonete",
        dueDate: "2026-10-02",
        paidDate: "2026-10-02",
        status: "paid",
        clientOrSupplier: "Posto Central Corbélia",
        paymentMethod: "Cartão",
        createdAt: new Date().toISOString()
      },
      {
        id: "tx-3",
        type: "expense",
        category: "Manutenção de Equipamentos e Maquinário",
        amount: 1200.00,
        description: "Revisão e Troca de Bicos de Pulverização Drone",
        dueDate: "2026-10-10",
        status: "pending",
        clientOrSupplier: "AgroPeças Paraná",
        paymentMethod: "Boleto",
        createdAt: new Date().toISOString()
      }
    ];

    setTransactions(initial);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  }, []);

  const saveTransactions = (updated: FinancialTransaction[]) => {
    setTransactions(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Indicadores
  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let pendingIncome = 0;
    let pendingExpense = 0;

    transactions.forEach(t => {
      if (t.type === 'income') {
        if (t.status === 'paid') totalIncome += t.amount;
        else pendingIncome += t.amount;
      } else {
        if (t.status === 'paid') totalExpense += t.amount;
        else pendingExpense += t.amount;
      }
    });

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      pendingIncome,
      pendingExpense
    };
  }, [transactions]);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const availableCategories = formData.type === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;

  // Filtragem
  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matches =
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.clientOrSupplier && t.clientOrSupplier.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, statusFilter, categoryFilter, searchTerm]);

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = formData.amount.replace(/[R$\s.]/g, '').replace(',', '.');
    const num = parseFloat(cleanAmount);
    if (isNaN(num) || num <= 0) {
      toast({ title: "Valor inválido", description: "Informe um valor maior que zero.", variant: "destructive" });
      return;
    }

    if (!formData.description.trim()) {
      toast({ title: "Descrição obrigatória", variant: "destructive" });
      return;
    }

    const newTx: FinancialTransaction = {
      id: "tx-" + Date.now(),
      type: formData.type,
      category: formData.category,
      amount: num,
      description: formData.description.trim(),
      dueDate: formData.dueDate,
      paidDate: formData.status === 'paid' ? (formData.paidDate || formData.dueDate) : undefined,
      status: formData.status,
      clientOrSupplier: formData.clientOrSupplier.trim() || undefined,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    saveTransactions([newTx, ...transactions]);
    toast({
      title: "Lançamento salvo com sucesso!",
      description: \`\${formData.type === 'income' ? 'Receita' : 'Despesa'} de \${formatBRL(num)} registrada.\`
    });

    setIsModalOpen(false);
    setFormData({
      type: 'expense',
      category: DEFAULT_EXPENSE_CATEGORIES[0],
      amount: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      paidDate: new Date().toISOString().split('T')[0],
      status: 'paid',
      clientOrSupplier: '',
      paymentMethod: 'PIX',
      notes: ''
    });
  };

  const handleToggleStatus = (id: string) => {
    const updated = transactions.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'paid' ? 'pending' : 'paid';
        return {
          ...t,
          status: nextStatus as 'pending' | 'paid',
          paidDate: nextStatus === 'paid' ? new Date().toISOString().split('T')[0] : undefined
        };
      }
      return t;
    });
    saveTransactions(updated);
    toast({ title: "Status do lançamento atualizado!" });
  };

  const handleDelete = (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    saveTransactions(updated);
    toast({ title: "Lançamento excluído com sucesso." });
  };

  return (
    <div className="space-y-6">
      {/* Cards de Resumo de Fluxo de Caixa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500 shadow-xs">
          <CardHeader className="pb-2 pt-4">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              Receitas Realizadas
              <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
            </CardDescription>
            <CardTitle className="text-xl font-bold text-emerald-600">{formatBRL(summary.totalIncome)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-[11px] text-muted-foreground">
            A receber pendente: {formatBRL(summary.pendingIncome)}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 shadow-xs">
          <CardHeader className="pb-2 pt-4">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              Despesas Realizadas
              <ArrowUpRight className="h-4 w-4 text-rose-600" />
            </CardDescription>
            <CardTitle className="text-xl font-bold text-rose-600">{formatBRL(summary.totalExpense)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-[11px] text-muted-foreground">
            A pagar pendente: {formatBRL(summary.pendingExpense)}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-xs">
          <CardHeader className="pb-2 pt-4">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              Saldo Líquido em Caixa
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardDescription>
            <CardTitle className={\`text-xl font-bold \${summary.balance >= 0 ? "text-blue-600" : "text-rose-600"}\`}>
              {formatBRL(summary.balance)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-[11px] text-muted-foreground">
            Entradas quitadas menos saídas
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-xs">
          <CardHeader className="pb-2 pt-4">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase">
              Previsão de Saldo Futuro
              <Clock className="h-4 w-4 text-amber-600" />
            </CardDescription>
            <CardTitle className="text-xl font-bold text-foreground">
              {formatBRL(summary.balance + summary.pendingIncome - summary.pendingExpense)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-[11px] text-muted-foreground">
            Considerando pendências
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros e Ação */}
      <Card className="p-4 bg-muted/20 border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div>
            <h3 className="text-base font-bold">Lançamentos de Contas a Pagar e Receber</h3>
            <p className="text-xs text-muted-foreground">Fluxo financeiro detalhado de entradas e saídas operacionais</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9">
            <Plus className="h-4 w-4 mr-1.5" />
            Novo Lançamento
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t">
          <div className="md:col-span-2">
            <Label className="text-xs font-semibold">Busca</Label>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar descrição, cliente ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-xs bg-background h-8"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Tipo</Label>
            <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val as any)}>
              <SelectTrigger className="mt-1 text-xs bg-background h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as movimentações</SelectItem>
                <SelectItem value="income">Entradas (Receitas)</SelectItem>
                <SelectItem value="expense">Saídas (Despesas)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold">Status</Label>
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
              <SelectTrigger className="mt-1 text-xs bg-background h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="paid">Quitado / Pago / Recebido</SelectItem>
                <SelectItem value="pending">Pendente / Em Aberto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("all");
                setStatusFilter("all");
                setCategoryFilter("all");
              }}
              className="w-full text-xs h-8 flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Limpar
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabela de Lançamentos */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição / Referência</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Cliente / Fornecedor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Data Pagto / Receb</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-xs">
                      Nenhum lançamento financeiro encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/40">
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={\`text-[11px] font-semibold py-0.5 px-2 flex items-center w-fit gap-1 \${
                            t.type === 'income'
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }\`}
                        >
                          {t.type === 'income' ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                          {t.type === 'income' ? "Receita" : "Despesa"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs">
                        <div className="font-semibold text-foreground">{t.description}</div>
                        {t.notes && <div className="text-[10px] text-muted-foreground italic">{t.notes}</div>}
                      </TableCell>

                      <TableCell className="text-xs font-medium">
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          {t.category}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {t.clientOrSupplier || "-"}
                      </TableCell>

                      <TableCell className="text-xs">
                        {t.dueDate ? new Date(t.dueDate + 'T00:00:00').toLocaleDateString('pt-BR') : "-"}
                      </TableCell>

                      <TableCell className="text-xs">
                        {t.paidDate ? (
                          <span className="text-emerald-700 font-medium">
                            {new Date(t.paidDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">Em aberto</span>
                        )}
                      </TableCell>

                      <TableCell className={\`text-xs font-bold \${t.type === 'income' ? "text-emerald-600" : "text-rose-600"}\`}>
                        {t.type === 'income' ? "+" : "-"} {formatBRL(t.amount)}
                      </TableCell>

                      <TableCell>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(t.id)}
                          className="cursor-pointer"
                          title="Clique para alternar entre Quitado e Pendente"
                        >
                          <Badge
                            className={\`text-[10px] py-0 px-2 \${
                              t.status === 'paid'
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                            }\`}
                          >
                            {t.status === 'paid' ? (t.type === 'income' ? "Recebido" : "Pago") : "Pendente"}
                          </Badge>
                        </button>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(t.id)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL DE NOVO LANÇAMENTO (RECEITA OU DESPESA) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Novo Lançamento Financeiro
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveTransaction} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(val: 'income' | 'expense') => {
                    setFormData({
                      ...formData,
                      type: val,
                      category: val === 'income' ? DEFAULT_INCOME_CATEGORIES[0] : DEFAULT_EXPENSE_CATEGORIES[0]
                    });
                  }}
                >
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Saída (Despesa)</SelectItem>
                    <SelectItem value="income">Entrada (Receita)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="tx-desc" className="text-xs font-semibold">Descrição</Label>
              <Input
                id="tx-desc"
                placeholder="Ex: Pagamento Fornecedor de Fertilizante"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                className="mt-1 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="tx-amount" className="text-xs font-semibold">Valor (R$)</Label>
                <Input
                  id="tx-amount"
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={(e) => {
                    // Máscara com separador e centavos
                    let v = e.target.value.replace(/\D/g, '');
                    if (!v) {
                      setFormData({ ...formData, amount: '' });
                      return;
                    }
                    const num = (parseInt(v) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                    setFormData({ ...formData, amount: num });
                  }}
                  required
                  className="mt-1 text-sm font-bold text-foreground"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Status Inicial</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val: 'pending' | 'paid') => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Já Quitado ({formData.type === 'income' ? 'Recebido' : 'Pago'})</SelectItem>
                    <SelectItem value="pending">Pendente (Agendado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="tx-due" className="text-xs font-semibold">Data de Vencimento</Label>
                <Input
                  id="tx-due"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="tx-paid" className="text-xs font-semibold">Data do Pagamento</Label>
                <Input
                  id="tx-paid"
                  type="date"
                  value={formData.paidDate}
                  onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
                  disabled={formData.status !== 'paid'}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="tx-client" className="text-xs font-semibold">Cliente ou Fornecedor</Label>
                <Input
                  id="tx-client"
                  placeholder="Ex: AgroMais LTDA"
                  value={formData.clientOrSupplier}
                  onChange={(e) => setFormData({ ...formData, clientOrSupplier: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Forma de Pagamento</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(val) => setFormData({ ...formData, paymentMethod: val })}
                >
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Boleto">Boleto Bancário</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Transferência">Transferência Bancária</SelectItem>
                    <SelectItem value="Cartão">Cartão</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="tx-notes" className="text-xs font-semibold">Observações (Opcional)</Label>
              <Input
                id="tx-notes"
                placeholder="Número NF, recibo ou detalhes adicionais..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>

            <DialogFooter className="pt-2 border-t flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Salvar Lançamento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
`;

fs.writeFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/financial/FinancialTransactionsTab.tsx', code, 'utf8');
console.log('Successfully created FinancialTransactionsTab.tsx!');
