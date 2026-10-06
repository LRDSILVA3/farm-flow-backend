const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../farm-flow-frontend/src/hooks/useFarms.ts');

const farmsCode = `import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import { Farm, Plot } from "@/types/farm";

export type { Farm, Plot };

interface FarmDB {
  id: string;
  user_id?: string;
  client_id: string | null;
  name: string;
  area: number | null;
  city: string | null;
  state: string | null;
  contact: string | null;
  status: string | null;
  registration: string | null;
  lot: string | null;
  created_at?: string;
  updated_at?: string;
  client?: { id: string; name: string } | null;
  plots?: PlotDB[];
}

interface PlotDB {
  id: string;
  farm_id: string;
  name: string;
  area: number | null;
  status: string | null;
  city: string | null;
  state: string | null;
  registration: string | null;
  lot: string | null;
  created_at?: string;
  updated_at?: string;
}

const mapPlotFromDB = (db: PlotDB): Plot => ({
  id: db.id,
  name: db.name,
  area: db.area !== null && db.area !== undefined ? db.area.toString() : "",
  status: db.status || "Ativo",
  city: db.city || "",
  state: db.state || "",
  registration: db.registration || "",
  lot: db.lot || ""
});

const mapFarmFromDB = (db: any): Farm => {
  const plotsList = Array.isArray(db.plots) ? db.plots : [];
  return {
    id: db.id,
    clientId: db.client_id || db.client?.id || "",
    name: db.name,
    clientName: db.client?.name || "",
    area: db.area !== null && db.area !== undefined ? db.area.toString() : "",
    city: db.city || "",
    state: db.state || "",
    contact: db.contact || "",
    status: db.status || "Ativo",
    registration: db.registration || "",
    lot: db.lot || "",
    plots: plotsList.map(mapPlotFromDB)
  };
};

export const useFarms = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFarmForm, setShowFarmForm] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [showPlotsModal, setShowPlotsModal] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);

  const [formData, setFormData] = useState<Farm>({
    id: "",
    clientId: "",
    name: "",
    clientName: "",
    area: "",
    city: "",
    state: "",
    contact: "",
    status: "Ativo",
    registration: "",
    lot: "",
    plots: []
  });

  const [plotForm, setPlotForm] = useState<Plot>({
    id: "",
    name: "",
    area: "",
    status: "Ativo",
    city: "",
    state: "",
    registration: "",
    lot: ""
  });

  const fetchFarms = async () => {
    try {
      const backendData = await api.get<any[]>('/farms');
      if (Array.isArray(backendData)) {
        const mapped = backendData.map(mapFarmFromDB);
        setFarms(mapped);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar fazendas",
        description: error.message || "Erro de conexão com o servidor local.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  const addFarm = async (farm: Omit<Farm, 'id' | 'plots'>) => {
    try {
      const created = await api.post<any>('/farms', {
        client_id: farm.clientId || null,
        name: farm.name,
        area: farm.area ? parseFloat(farm.area) : null,
        city: farm.city || null,
        state: farm.state || null,
        contact: farm.contact || null,
        status: farm.status || "Ativo",
        registration: farm.registration || null,
        lot: farm.lot || null
      });
      await fetchFarms();
      toast({
        title: "Fazenda cadastrada",
        description: "A fazenda foi cadastrada com sucesso."
      });
      return created;
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar fazenda",
        description: error.message || "Falha ao gravar no banco de dados.",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateFarm = async (farm: Farm) => {
    try {
      await api.put<any>(\`/farms/\${farm.id}\`, {
        client_id: farm.clientId || null,
        name: farm.name,
        area: farm.area ? parseFloat(farm.area) : null,
        city: farm.city || null,
        state: farm.state || null,
        contact: farm.contact || null,
        status: farm.status || "Ativo",
        registration: farm.registration || null,
        lot: farm.lot || null
      });
      await fetchFarms();
      toast({
        title: "Fazenda atualizada",
        description: "A fazenda foi atualizada com sucesso."
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar fazenda",
        description: error.message || "Falha ao atualizar fazenda.",
        variant: "destructive"
      });
    }
  };

  const deleteFarm = async (farmId: string) => {
    try {
      await api.delete(\`/farms/\${farmId}\`);
      await fetchFarms();
      toast({
        title: "Fazenda removida",
        description: "A fazenda foi excluída com sucesso."
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover fazenda",
        description: error.message || "Falha ao excluir fazenda.",
        variant: "destructive"
      });
    }
  };

  const addPlot = async (farmId: string, plot: Omit<Plot, 'id'>) => {
    try {
      const createdPlot = await api.post<any>(\`/farms/\${farmId}/plots\`, {
        name: plot.name,
        area: plot.area ? parseFloat(plot.area) : null,
        status: plot.status || "Ativo",
        city: plot.city || null,
        state: plot.state || null,
        registration: plot.registration || null,
        lot: plot.lot || null
      });
      await fetchFarms();

      const mapped = mapPlotFromDB(createdPlot);
      if (selectedFarm?.id === farmId) {
        setSelectedFarm(prev => prev ? { ...prev, plots: [...prev.plots, mapped] } : null);
      }

      toast({
        title: "Talhão adicionado",
        description: "O talhão foi adicionado com sucesso."
      });
      return createdPlot;
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar talhão",
        description: error.message || "Falha ao salvar talhão no banco.",
        variant: "destructive"
      });
      return null;
    }
  };

  const deletePlot = async (farmId: string, plotId: string) => {
    try {
      await api.delete(\`/farms/plots/\${plotId}\`);
      await fetchFarms();

      if (selectedFarm?.id === farmId) {
        setSelectedFarm(prev => prev ? { ...prev, plots: prev.plots.filter(p => p.id !== plotId) } : null);
      }

      toast({
        title: "Talhão removido",
        description: "O talhão foi removido com sucesso."
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover talhão",
        description: error.message || "Falha ao excluir talhão.",
        variant: "destructive"
      });
    }
  };

  return {
    farms,
    setFarms,
    loading,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    showFarmForm,
    setShowFarmForm,
    editingFarm,
    setEditingFarm,
    showPlotsModal,
    setShowPlotsModal,
    selectedFarm,
    setSelectedFarm,
    formData,
    setFormData,
    plotForm,
    setPlotForm,
    addFarm,
    updateFarm,
    deleteFarm,
    addPlot,
    deletePlot,
    refetch: fetchFarms
  };
};
`;

fs.writeFileSync(targetPath, farmsCode, 'utf8');
console.log('✅ useFarms.ts rewritten 100% to backend REST API with zero Supabase dependencies!');
