const fs = require('fs');
const path = require('path');

// 1. Update MainLayout.tsx
const mainLayoutPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/MainLayout.tsx');

const layoutCode = `import { useState, useMemo, useCallback } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Home,
  Users,
  MapPin,
  FileText,
  Calendar,
  DollarSign,
  Settings,
  LogOut,
  FlaskConical,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import CustomersPage from "./pages/CustomersPage";
import FarmsPage from "./pages/FarmPage";
import OrdersPage from "./pages/OrdersPage";
import SchedulePage from "./pages/SchedulePage";
import FinancialPage from "./pages/FinancialPage";
import SettingsPage from "./pages/SettingsPage";
import DashboardHome from "./pages/DashboardHome";
import AnalysisPage from "./pages/AnalysisPage";

const MainLayoutContent = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const { toast } = useToast();
  const { signOut } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLogout = async () => {
    await signOut();
  };

  const menuItems = [
    { id: "dashboard", title: "Dashboard", icon: Home },
    { id: "customers", title: "Clientes", icon: Users },
    { id: "farms", title: "Fazendas", icon: MapPin },
    { id: "orders", title: "Pedidos", icon: FileText },
    { id: "schedule", title: "Agenda", icon: Calendar },
    { id: "analysis", title: "Análises", icon: FlaskConical },
    { id: "financial", title: "Financeiro", icon: DollarSign },
    { id: "settings", title: "Configurações", icon: Settings },
  ];

  const handleNavigateToFarms = useCallback((customerCpf: string) => {
    setCurrentPage("farms");
    if (isMobile) setOpenMobile(false);
  }, [isMobile, setOpenMobile]);

  const handleMenuClick = useCallback((pageId: string) => {
    setCurrentPage(pageId);
    if (isMobile) setOpenMobile(false);
  }, [isMobile, setOpenMobile]);

  const currentPageComponent = useMemo(() => {
    switch (currentPage) {
      case "customers":
        return <CustomersPage onNavigateToFarms={handleNavigateToFarms} />;
      case "farms":
        return <FarmsPage />;
      case "orders":
        return <OrdersPage />;
      case "schedule":
        return <SchedulePage />;
      case "financial":
        return <FinancialPage />;
      case "settings":
        return <SettingsPage />;
      case "analysis":
        return <AnalysisPage />;
      default:
        return <DashboardHome onNavigate={handleMenuClick} />;
    }
  }, [currentPage, handleNavigateToFarms, handleMenuClick]);

  return (
    <>
      <Sidebar>
        <SidebarHeader className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-700 flex items-center justify-center text-white font-bold">
              P
            </div>
            <div>
              <h2 className="text-lg font-bold text-green-700 leading-tight">Preciza</h2>
              <p className="text-xs text-muted-foreground">Agricultura de Precisão</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  onClick={() => handleMenuClick(item.id)}
                  isActive={currentPage === item.id}
                  className="gap-3 py-2.5 rounded-md"
                >
                  <item.icon className="h-4 w-4" />
                  <span className="font-medium text-sm">{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem className="mt-4 pt-4 border-t">
              <SidebarMenuButton onClick={handleLogout} className="gap-3 py-2.5 text-red-600 hover:text-red-700 hover:bg-red-50">
                <LogOut className="h-4 w-4" />
                <span className="font-medium text-sm">Sair</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="flex flex-col flex-1 w-full min-w-0 bg-slate-50/50">
        <header className="flex h-14 sm:h-16 shrink-0 items-center justify-between border-b px-4 sm:px-8 bg-white sticky top-0 z-10 shadow-sm w-full">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <span className="text-xs sm:text-sm font-semibold text-slate-800 hidden sm:inline">
              Preciza CRM
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <span className="hidden md:inline">Ambiente:</span>
            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-semibold text-xs">
              Online
            </span>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full min-w-0 overflow-x-hidden">
          <div key={currentPage} className="animate-fade-in w-full">
            {currentPageComponent}
          </div>
        </div>
      </SidebarInset>
    </>
  );
};

const MainLayout = () => {
  return (
    <SidebarProvider className="w-full min-h-screen bg-slate-50/50">
      <MainLayoutContent />
    </SidebarProvider>
  );
};

export default MainLayout;
`;

fs.writeFileSync(mainLayoutPath, layoutCode, 'utf8');
console.log('✅ MainLayout.tsx updated with clean layout');

// 2. Update DashboardHome.tsx
const dashboardPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/DashboardHome.tsx');

const dashboardCode = `import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  MapPin,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  PlusCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Sparkles,
} from "lucide-react";
import { useCounterAnimation } from "@/hooks/useCounterAnimation";
import { api } from "@/services/api";

const AnimatedValue = ({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) => {
  const animatedCount = useCounterAnimation(value, 2000);
  
  const formatNumber = (num: number) => {
    return num.toLocaleString('pt-BR');
  };

  return (
    <span>
      {prefix}{formatNumber(animatedCount)}{suffix}
    </span>
  );
};

interface DashboardStats {
  activeClients: number;
  registeredFarms: number;
  pendingOrders: number;
  scheduledExecutions: number;
  monthlyRevenue: number;
  workedHectares: number;
}

interface OrderItem {
  id: string;
  order_number?: string;
  client?: { name: string };
  farm?: { name: string };
  service_name?: string;
  type?: string;
  area?: number;
  executed_area?: number;
  value?: number;
  status: string;
  payment?: string;
  created_at?: string;
}

interface DashboardHomeProps {
  onNavigate?: (pageId: string) => void;
}

const DashboardHome = ({ onNavigate }: DashboardHomeProps) => {
  const [stats, setStats] = useState<DashboardStats>({
    activeClients: 0,
    registeredFarms: 0,
    pendingOrders: 0,
    scheduledExecutions: 0,
    monthlyRevenue: 0,
    workedHectares: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [upcomingExecutions, setUpcomingExecutions] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderItem[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<{
    concluidos: number;
    emAndamento: number;
    pendentes: number;
    cancelados: number;
    total: number;
  }>({ concluidos: 0, emAndamento: 0, pendentes: 0, cancelados: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [clients, farms, orders] = await Promise.all([
        api.get<any[]>('/clients').catch(() => []),
        api.get<any[]>('/farms').catch(() => []),
        api.get<any[]>('/orders').catch(() => []),
      ]);

      const clientsList = Array.isArray(clients) ? clients : [];
      const farmsList = Array.isArray(farms) ? farms : [];
      const ordersList: OrderItem[] = Array.isArray(orders) ? orders : [];

      const pendingOrdersCount = ordersList.filter(o => o.status === 'Pendente' || o.status === 'Pending').length;
      const concluidosCount = ordersList.filter(o => o.status === 'Concluído' || o.status === 'Concluido').length;
      const emAndamentoCount = ordersList.filter(o => o.status === 'Em Andamento' || o.status === 'Aprovado').length;
      const canceladosCount = ordersList.filter(o => o.status === 'Cancelado').length;
      
      let scheduledCount = 0;
      let upcomingList: any[] = [];
      ordersList.forEach(order => {
        const scheds = Array.isArray((order as any).schedules) ? (order as any).schedules : [];
        scheduledCount += scheds.length;
        scheds.forEach((s: any) => {
          upcomingList.push({
            id: s.id || Math.random().toString(),
            service: order.service_name || order.type || 'Serviço',
            area: order.area ? \`\${order.area} ha\` : '-',
            farmName: order.farm?.name || 'Fazenda',
            date: s.scheduledDate ? new Date(s.scheduledDate).toLocaleDateString('pt-BR') : 'A definir'
          });
        });
      });

      const totalRevenue = ordersList
        .filter(o => o.status === 'Concluído' || o.payment === 'Pago')
        .reduce((sum, o) => sum + (Number(o.value) || 0), 0);

      const totalHectares = ordersList
        .reduce((sum, o) => sum + (Number(o.executed_area) || 0), 0);

      setStats({
        activeClients: clientsList.length,
        registeredFarms: farmsList.length,
        pendingOrders: pendingOrdersCount,
        scheduledExecutions: scheduledCount,
        monthlyRevenue: totalRevenue,
        workedHectares: Math.round(totalHectares * 10) / 10
      });

      setStatusDistribution({
        concluidos: concluidosCount,
        emAndamento: emAndamentoCount,
        pendentes: pendingOrdersCount,
        cancelados: canceladosCount,
        total: ordersList.length
      });

      // Recent activities (recent clients or updates)
      setRecentActivities(clientsList.slice(0, 5).map(c => ({
        action: \`Novo cliente: \${c.name}\`,
        time: c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : 'Recentemente',
        user: c.name
      })));

      setUpcomingExecutions(upcomingList.slice(0, 4));
      setRecentOrders(ordersList.slice(0, 5));

    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Concluído":
      case "Concluido":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none font-medium">Concluído</Badge>;
      case "Em Andamento":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none font-medium">Em Andamento</Badge>;
      case "Aprovado":
        return <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-none font-medium">Aprovado</Badge>;
      case "Cancelado":
        return <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-200 border-none font-medium">Cancelado</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none font-medium">Pendente</Badge>;
    }
  };

  const dashboardCards = [
    {
      title: "Clientes Ativos",
      value: stats.activeClients,
      description: "Total cadastrado",
      icon: Users,
      color: "text-blue-600",
      bgLight: "bg-blue-50/80"
    },
    {
      title: "Fazendas Cadastradas",
      value: stats.registeredFarms,
      description: "Total cadastrado",
      icon: MapPin,
      color: "text-green-600",
      bgLight: "bg-green-50/80"
    },
    {
      title: "Pedidos Pendentes",
      value: stats.pendingOrders,
      description: "Para aprovação",
      icon: FileText,
      color: "text-orange-600",
      bgLight: "bg-orange-50/80"
    },
    {
      title: "Execuções Agendadas",
      value: stats.scheduledExecutions,
      description: "Próximos dias",
      icon: Calendar,
      color: "text-purple-600",
      bgLight: "bg-purple-50/80"
    },
    {
      title: "Faturamento Real",
      value: stats.monthlyRevenue,
      prefix: "R$ ",
      description: "Pedidos concluídos / pagos",
      icon: DollarSign,
      color: "text-emerald-600",
      bgLight: "bg-emerald-50/80"
    },
    {
      title: "Hectares Trabalhados",
      value: stats.workedHectares,
      suffix: " ha",
      description: "Total executado",
      icon: TrendingUp,
      color: "text-cyan-600",
      bgLight: "bg-cyan-50/80"
    }
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Visão geral em tempo real da Preciza Agricultura de Precisão</p>
        </div>
        <div className="flex items-center gap-2">
          {onNavigate && (
            <Button
              onClick={() => onNavigate("orders")}
              className="bg-green-700 hover:bg-green-800 text-white shadow-sm gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Novo Pedido
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards: 1 col on mobile, 2 on sm, 3 on md/lg, 6 on 2xl/xl */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
        {dashboardCards.map((card, index) => (
          <Card key={index} className="shadow-sm hover:shadow-md transition-all duration-200 border-slate-200/80 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 truncate">{card.title}</CardTitle>
              <div className={\`p-1.5 rounded-md \${card.bgLight}\`}>
                <card.icon className={\`h-4 w-4 \${card.color}\`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                <AnimatedValue 
                  value={card.value} 
                  prefix={card.prefix || ""} 
                  suffix={card.suffix || ""} 
                />
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Operations & Activities: 3-column balanced grid on widescreen */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
        {/* Atividades Recentes */}
        <Card className="shadow-sm border-slate-200/80 bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">Atividades Recentes</CardTitle>
                <CardDescription className="text-xs text-slate-500">Últimos clientes cadastrados</CardDescription>
              </div>
              {onNavigate && (
                <Button variant="ghost" size="sm" onClick={() => onNavigate("customers")} className="text-xs text-green-700 hover:text-green-800 p-0 h-auto font-medium">
                  Ver clientes <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <p className="text-center text-slate-400 py-6 text-sm">Nenhuma atividade recente</p>
            ) : (
              <div className="space-y-2.5">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 border border-slate-100 hover:bg-slate-100/80 transition-colors text-xs sm:text-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center shrink-0">
                        {activity.user ? activity.user.slice(0, 2).toUpperCase() : "CL"}
                      </div>
                      <span className="font-medium text-slate-800 truncate">{activity.action}</span>
                    </div>
                    <span className="text-slate-400 text-xs shrink-0 ml-2">{activity.time}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Próximas Execuções */}
        <Card className="shadow-sm border-slate-200/80 bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">Próximas Execuções</CardTitle>
                <CardDescription className="text-xs text-slate-500">Serviços agendados no campo</CardDescription>
              </div>
              {onNavigate && (
                <Button variant="ghost" size="sm" onClick={() => onNavigate("schedule")} className="text-xs text-purple-700 hover:text-purple-800 p-0 h-auto font-medium">
                  Ver agenda <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {upcomingExecutions.length === 0 ? (
              <p className="text-center text-slate-400 py-6 text-sm">Nenhuma execução agendada</p>
            ) : (
              <div className="space-y-2.5">
                {upcomingExecutions.map((execution, index) => (
                  <div key={index} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 border border-slate-100 hover:bg-slate-100/80 transition-colors text-xs sm:text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{execution.service}</p>
                      <p className="text-xs text-slate-500 truncate">{execution.farmName} • {execution.area}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-purple-100 text-purple-800 shrink-0 ml-2">
                      {execution.date}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status dos Pedidos & Ações Rápidas */}
        <Card className="shadow-sm border-slate-200/80 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">Visão Geral dos Pedidos</CardTitle>
            <CardDescription className="text-xs text-slate-500">Distribuição operacional</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-100">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold mb-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Concluídos
                </div>
                <div className="text-lg font-bold text-emerald-900">{statusDistribution.concluidos}</div>
              </div>
              <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-100">
                <div className="flex items-center gap-1.5 text-blue-800 font-semibold mb-1">
                  <Clock className="h-3.5 w-3.5" /> Em Andamento
                </div>
                <div className="text-lg font-bold text-blue-900">{statusDistribution.emAndamento}</div>
              </div>
              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-100">
                <div className="flex items-center gap-1.5 text-amber-800 font-semibold mb-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Pendentes
                </div>
                <div className="text-lg font-bold text-amber-900">{statusDistribution.pendentes}</div>
              </div>
              <div className="p-3 rounded-lg bg-rose-50/70 border border-rose-100">
                <div className="flex items-center gap-1.5 text-rose-800 font-semibold mb-1">
                  <XCircle className="h-3.5 w-3.5" /> Cancelados
                </div>
                <div className="text-lg font-bold text-rose-900">{statusDistribution.cancelados}</div>
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-xs font-semibold text-slate-500 block">Atalhos Operacionais</span>
              <div className="grid grid-cols-2 gap-2">
                {onNavigate && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => onNavigate("customers")} className="text-xs justify-start h-8">
                      <Users className="h-3.5 w-3.5 mr-1.5 text-blue-600" /> + Cliente
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onNavigate("farms")} className="text-xs justify-start h-8">
                      <MapPin className="h-3.5 w-3.5 mr-1.5 text-green-600" /> + Fazenda
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onNavigate("schedule")} className="text-xs justify-start h-8">
                      <Calendar className="h-3.5 w-3.5 mr-1.5 text-purple-600" /> Agenda
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onNavigate("financial")} className="text-xs justify-start h-8">
                      <DollarSign className="h-3.5 w-3.5 mr-1.5 text-emerald-600" /> Financeiro
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Overview Table: Fills widescreen naturally */}
      <Card className="shadow-sm border-slate-200/80 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">Últimos Pedidos Cadastrados</CardTitle>
              <CardDescription className="text-xs text-slate-500">Acompanhamento rápido de serviços recentes</CardDescription>
            </div>
            {onNavigate && (
              <Button variant="outline" size="sm" onClick={() => onNavigate("orders")} className="text-xs gap-1.5 font-medium">
                Ver todos os pedidos <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-center text-slate-400 py-6 text-sm">Nenhum pedido encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs font-medium">
                    <th className="pb-2">Cliente</th>
                    <th className="pb-2">Fazenda</th>
                    <th className="pb-2">Serviço</th>
                    <th className="pb-2">Área Total</th>
                    <th className="pb-2">Valor</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 font-medium text-slate-800">{order.client?.name || "-"}</td>
                      <td className="py-2.5 text-slate-600">{order.farm?.name || "-"}</td>
                      <td className="py-2.5 text-slate-700 font-medium">{order.service_name || order.type || "-"}</td>
                      <td className="py-2.5 text-slate-600">{order.area ? \`\${order.area} ha\` : "-"}</td>
                      <td className="py-2.5 font-semibold text-slate-900">
                        {order.value ? \`R$ \${Number(order.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\` : "R$ 0,00"}
                      </td>
                      <td className="py-2.5">{getStatusBadge(order.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHome;
`;

fs.writeFileSync(dashboardPath, dashboardCode, 'utf8');
console.log('✅ DashboardHome.tsx updated with responsive widescreen layout and rich analytics!');
