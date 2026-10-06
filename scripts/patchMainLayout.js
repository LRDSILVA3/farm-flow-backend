const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/MainLayout.tsx');

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
        return <DashboardHome />;
    }
  }, [currentPage, handleNavigateToFarms]);

  return (
    <div className="min-h-screen flex w-full bg-slate-50/50">
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

      <SidebarInset className="flex flex-col flex-1 w-full max-w-full overflow-hidden">
        <header className="flex h-14 sm:h-16 shrink-0 items-center justify-between border-b px-3 sm:px-6 bg-white sticky top-0 z-10 shadow-sm">
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

        <main className="flex-1 p-3 sm:p-6 w-full max-w-full overflow-x-hidden">
          <div key={currentPage} className="animate-fade-in w-full">
            {currentPageComponent}
          </div>
        </main>
      </SidebarInset>
    </div>
  );
};

const MainLayout = () => {
  return (
    <SidebarProvider>
      <MainLayoutContent />
    </SidebarProvider>
  );
};

export default MainLayout;
`;

fs.writeFileSync(targetPath, layoutCode, 'utf8');
console.log('✅ MainLayout.tsx updated with clean responsive layout and mobile drawer auto-close!');
