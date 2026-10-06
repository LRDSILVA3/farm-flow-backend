const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/DashboardHome.tsx');

const dashboardCode = `import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MapPin, FileText, Calendar, DollarSign, TrendingUp } from "lucide-react";
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

const DashboardHome = () => {
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
      const ordersList = Array.isArray(orders) ? orders : [];

      const pendingOrdersCount = ordersList.filter(o => o.status === 'Pendente' || o.status === 'Pending').length;
      
      let scheduledCount = 0;
      let upcomingList: any[] = [];
      ordersList.forEach(order => {
        const scheds = Array.isArray(order.schedules) ? order.schedules : [];
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

      setRecentActivities(clientsList.slice(0, 4).map(c => ({
        action: \`Novo cliente: \${c.name}\`,
        time: c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : 'Recentemente',
        user: c.name
      })));

      setUpcomingExecutions(upcomingList.slice(0, 3));

    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardCards = [
    {
      title: "Clientes Ativos",
      value: stats.activeClients,
      description: "Total cadastrado",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Fazendas Cadastradas",
      value: stats.registeredFarms,
      description: "Total cadastrado",
      icon: MapPin,
      color: "text-green-600"
    },
    {
      title: "Pedidos Pendentes",
      value: stats.pendingOrders,
      description: "Para aprovação",
      icon: FileText,
      color: "text-orange-600"
    },
    {
      title: "Execuções Agendadas",
      value: stats.scheduledExecutions,
      description: "Próximos dias",
      icon: Calendar,
      color: "text-purple-600"
    },
    {
      title: "Faturamento Real",
      value: stats.monthlyRevenue,
      prefix: "R$ ",
      description: "Pedidos concluídos / pagos",
      icon: DollarSign,
      color: "text-emerald-600"
    },
    {
      title: "Hectares Trabalhados",
      value: stats.workedHectares,
      suffix: " ha",
      description: "Total executado",
      icon: TrendingUp,
      color: "text-cyan-600"
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral em tempo real da Preciza Agricultura de Precisão</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {dashboardCards.map((card, index) => (
          <Card key={index} className="shadow-sm hover:shadow transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={\`h-4 w-4 \${card.color}\`} />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                <AnimatedValue 
                  value={card.value} 
                  prefix={card.prefix || ""} 
                  suffix={card.suffix || ""} 
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Atividades Recentes</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Últimos clientes cadastrados</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">Nenhuma atividade recente</p>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border text-xs sm:text-sm">
                    <span className="font-medium text-slate-800">{activity.action}</span>
                    <span className="text-muted-foreground text-xs">{activity.time}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Próximas Execuções</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Serviços agendados</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingExecutions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">Nenhuma execução agendada</p>
            ) : (
              <div className="space-y-3">
                {upcomingExecutions.map((execution, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border text-xs sm:text-sm">
                    <div>
                      <p className="font-semibold text-slate-800">{execution.service}</p>
                      <p className="text-xs text-muted-foreground">{execution.farmName} • {execution.area}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-purple-100 text-purple-800">
                      {execution.date}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;
`;

fs.writeFileSync(targetPath, dashboardCode, 'utf8');
console.log('✅ DashboardHome.tsx patched to use 100% backend API + mobile responsive grid!');
