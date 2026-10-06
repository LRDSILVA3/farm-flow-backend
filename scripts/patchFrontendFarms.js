const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../../farm-flow-frontend/src/hooks/useFarms.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace addFarm
const oldAddFarm = `  const addFarm = async (farm: Omit<Farm, 'id' | 'plots'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("farms")
        .insert({
          user_id: user.id,
          client_id: farm.clientId || null, // Use clientId
          name: farm.name,
          area: farm.area ? parseFloat(farm.area) : null,
          city: farm.city || null,
          state: farm.state || null,
          contact: farm.contact || null,
          status: farm.status || "Active",
          registration: farm.registration || null,
          lot: farm.lot || null
        })
        .select()
        .single();

      if (error) throw error;
      setFarms(prev => [...prev, mapFarmFromDB(data as unknown as FarmDB, [])]);
      toast({
        title: "Fazenda cadastrada",
        description: "A fazenda foi cadastrada com sucesso."
      });
      return data;
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar fazenda",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };`;

const newAddFarm = `  const addFarm = async (farm: Omit<Farm, 'id' | 'plots'>) => {
    try {
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
      } catch (backendErr) {
        console.warn("Backend addFarm failed, trying Supabase fallback", backendErr);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("farms")
        .insert({
          user_id: user.id,
          client_id: farm.clientId || null,
          name: farm.name,
          area: farm.area ? parseFloat(farm.area) : null,
          city: farm.city || null,
          state: farm.state || null,
          contact: farm.contact || null,
          status: farm.status || "Active",
          registration: farm.registration || null,
          lot: farm.lot || null
        })
        .select()
        .single();

      if (error) throw error;
      await fetchFarms();
      toast({
        title: "Fazenda cadastrada",
        description: "A fazenda foi cadastrada com sucesso."
      });
      return data;
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar fazenda",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };`;

// Replace updateFarm
const oldUpdateFarm = `  const updateFarm = async (farm: Farm) => {
    try {
      const { error } = await supabase
        .from("farms")
        .update({
          client_id: farm.clientId || null, // Use clientId
          name: farm.name,
          area: farm.area ? parseFloat(farm.area) : null,
          city: farm.city || null,
          state: farm.state || null,
          contact: farm.contact || null,
          status: farm.status || "Active",
          registration: farm.registration || null,
          lot: farm.lot || null
        })
        .eq("id", farm.id);

      if (error) throw error;
      setFarms(prev => prev.map(f => f.id === farm.id ? farm : f));
      toast({
        title: "Fazenda atualizada",
        description: "A fazenda foi atualizada com sucesso."
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar fazenda",
        description: error.message,
        variant: "destructive"
      });
    }
  };`;

const newUpdateFarm = `  const updateFarm = async (farm: Farm) => {
    try {
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
        return;
      } catch (backendErr) {
        console.warn("Backend updateFarm failed, trying Supabase fallback", backendErr);
      }

      const { error } = await supabase
        .from("farms")
        .update({
          client_id: farm.clientId || null,
          name: farm.name,
          area: farm.area ? parseFloat(farm.area) : null,
          city: farm.city || null,
          state: farm.state || null,
          contact: farm.contact || null,
          status: farm.status || "Active",
          registration: farm.registration || null,
          lot: farm.lot || null
        })
        .eq("id", farm.id);

      if (error) throw error;
      await fetchFarms();
      toast({
        title: "Fazenda atualizada",
        description: "A fazenda foi atualizada com sucesso."
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar fazenda",
        description: error.message,
        variant: "destructive"
      });
    }
  };`;

// Replace addPlot
const oldAddPlot = `  const addPlot = async (farmId: string, plot: Omit<Plot, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from("plots")
        .insert({
          farm_id: farmId,
          name: plot.name,
          area: plot.area ? parseFloat(plot.area) : null,
          status: plot.status || "Active",
          city: plot.city || null,
          state: plot.state || null,
          registration: plot.registration || null,
          lot: plot.lot || null
        })
        .select()
        .single();

      if (error) throw error;
      
      const newPlot = mapPlotFromDB(data);
      setFarms(prev => prev.map(f => {
        if (f.id === farmId) {
          return { ...f, plots: [...f.plots, newPlot] };
        }
        return f;
      }));
      
      if (selectedFarm?.id === farmId) {
        setSelectedFarm(prev => prev ? { ...prev, plots: [...prev.plots, newPlot] } : null);
      }
      
      toast({
        title: "Talhão adicionado",
        description: "O talhão foi adicionado com sucesso."
      });
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar talhão",
        description: error.message,
        variant: "destructive"
      });
    }
  };`;

const newAddPlot = `  const addPlot = async (farmId: string, plot: Omit<Plot, 'id'>) => {
    try {
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
      } catch (backendErr) {
        console.warn("Backend addPlot failed, trying Supabase fallback", backendErr);
      }

      const { data, error } = await supabase
        .from("plots")
        .insert({
          farm_id: farmId,
          name: plot.name,
          area: plot.area ? parseFloat(plot.area) : null,
          status: plot.status || "Active",
          city: plot.city || null,
          state: plot.state || null,
          registration: plot.registration || null,
          lot: plot.lot || null
        })
        .select()
        .single();

      if (error) throw error;
      
      const newPlot = mapPlotFromDB(data);
      setFarms(prev => prev.map(f => {
        if (f.id === farmId) {
          return { ...f, plots: [...f.plots, newPlot] };
        }
        return f;
      }));
      
      if (selectedFarm?.id === farmId) {
        setSelectedFarm(prev => prev ? { ...prev, plots: [...prev.plots, newPlot] } : null);
      }
      
      toast({
        title: "Talhão adicionado",
        description: "O talhão foi adicionado com sucesso."
      });
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar talhão",
        description: error.message,
        variant: "destructive"
      });
    }
  };`;

// Replace deletePlot
const oldDeletePlot = `  const deletePlot = async (farmId: string, plotId: string) => {
    try {
      const { error } = await supabase
        .from("plots")
        .delete()
        .eq("id", plotId);

      if (error) throw error;
      
      setFarms(prev => prev.map(f => {
        if (f.id === farmId) {
          return { ...f, plots: f.plots.filter(p => p.id !== plotId) };
        }
        return f;
      }));
      
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
        description: error.message,
        variant: "destructive"
      });
    }
  };`;

const newDeletePlot = `  const deletePlot = async (farmId: string, plotId: string) => {
    try {
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
        return;
      } catch (backendErr) {
        console.warn("Backend deletePlot failed, trying Supabase fallback", backendErr);
      }

      const { error } = await supabase
        .from("plots")
        .delete()
        .eq("id", plotId);

      if (error) throw error;
      
      setFarms(prev => prev.map(f => {
        if (f.id === farmId) {
          return { ...f, plots: f.plots.filter(p => p.id !== plotId) };
        }
        return f;
      }));
      
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
        description: error.message,
        variant: "destructive"
      });
    }
  };`;

content = content.replace(oldAddFarm, newAddFarm);
content = content.replace(oldUpdateFarm, newUpdateFarm);
content = content.replace(oldAddPlot, newAddPlot);
content = content.replace(oldDeletePlot, newDeletePlot);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ useFarms.ts patched to prioritize backend REST API for all CRUD!');
