const fs = require('fs');
const path = require('path');

const frontendDir = path.resolve(__dirname, '../../farm-flow-frontend');

// ==========================================
// 1. UPDATE useFarms.ts
// ==========================================
const farmsFilePath = path.join(frontendDir, 'src/hooks/useFarms.ts');
let farmsContent = fs.readFileSync(farmsFilePath, 'utf8');

// Replace addFarm
const addFarmRegex = /const addFarm = async \(farm: Omit<Farm, 'id' \| 'plots'>\) => \{[\s\S]*?return null;\s*\};/;
const newAddFarm = `const addFarm = async (farm: Omit<Farm, 'id' | 'plots'>) => {
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

        if (created && created.id) {
          const newFarm: Farm = {
            id: created.id,
            clientId: created.client_id || farm.clientId || "",
            name: created.name,
            clientName: farm.clientName || "",
            area: created.area?.toString() || farm.area || "",
            city: created.city || farm.city || "",
            state: created.state || farm.state || "",
            contact: created.contact || farm.contact || "",
            status: created.status || "Ativo",
            registration: created.registration || farm.registration || "",
            lot: created.lot || farm.lot || "",
            plots: []
          };
          setFarms(prev => [...prev, newFarm]);
          toast({
            title: "Fazenda cadastrada",
            description: "A fazenda foi cadastrada com sucesso."
          });
          return newFarm;
        }
      } catch {
        // Fallback to Supabase
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

// Replace updateFarm
const updateFarmRegex = /const updateFarm = async \(farm: Farm\) => \{[\s\S]*?variant: "destructive"\s*\}\);\s*\};/;
const newUpdateFarm = `const updateFarm = async (farm: Farm) => {
    try {
      try {
        const updated = await api.put<any>(\`/farms/\${farm.id}\`, {
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

        if (updated) {
          setFarms(prev => prev.map(f => f.id === farm.id ? { ...farm, ...updated, plots: farm.plots } : f));
          toast({
            title: "Fazenda atualizada",
            description: "A fazenda foi atualizada com sucesso."
          });
          return;
        }
      } catch {
        // Fallback to Supabase
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

// Replace addPlot
const addPlotRegex = /const addPlot = async \(farmId: string, plot: Omit<Plot, 'id'>\) => \{[\s\S]*?variant: "destructive"\s*\}\);\s*\};/;
const newAddPlot = `const addPlot = async (farmId: string, plot: Omit<Plot, 'id'>) => {
    try {
      try {
        const created = await api.post<any>(\`/farms/\${farmId}/plots\`, {
          name: plot.name,
          area: plot.area ? parseFloat(plot.area) : null,
          status: plot.status || "Ativo",
          city: plot.city || null,
          state: plot.state || null,
          registration: plot.registration || null,
          lot: plot.lot || null
        });

        if (created && created.id) {
          const newPlot: Plot = {
            id: created.id,
            name: created.name,
            area: created.area?.toString() || plot.area || "",
            status: created.status || "Ativo",
            city: created.city || "",
            state: created.state || "",
            registration: created.registration || "",
            lot: created.lot || ""
          };
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
          return;
        }
      } catch {
        // Fallback to Supabase
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
const deletePlotRegex = /const deletePlot = async \(farmId: string, plotId: string\) => \{[\s\S]*?variant: "destructive"\s*\}\);\s*\};/;
const newDeletePlot = `const deletePlot = async (farmId: string, plotId: string) => {
    try {
      try {
        await api.delete(\`/farms/plots/\${plotId}\`);
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
        return;
      } catch {
        // Fallback to Supabase
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

farmsContent = farmsContent.replace(addFarmRegex, newAddFarm);
farmsContent = farmsContent.replace(updateFarmRegex, newUpdateFarm);
farmsContent = farmsContent.replace(addPlotRegex, newAddPlot);
farmsContent = farmsContent.replace(deletePlotRegex, newDeletePlot);

fs.writeFileSync(farmsFilePath, farmsContent, 'utf8');
console.log('✅ useFarms.ts updated with Backend mutations + Supabase fallback');


// ==========================================
// 2. UPDATE useCostVariables.ts
// ==========================================
const costVarsFilePath = path.join(frontendDir, 'src/hooks/useCostVariables.ts');
let costVarsContent = fs.readFileSync(costVarsFilePath, 'utf8');

const costSubmitRegex = /const handleCostVariableSubmit = async \(e: FormEvent\) => \{[\s\S]*?resetCostVariableForm\(\);\s*\};/;
const newCostSubmit = `const handleCostVariableSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (editingCostVariable) {
      try {
        const updated = await api.put<any>(\`/cost-variables/\${costVariableFormData.code}\`, {
          name: costVariableFormData.name,
          value: Number(costVariableFormData.value),
          description: costVariableFormData.description
        });
        if (updated) {
          toast({ title: "Variável atualizada", description: "A variável foi atualizada com sucesso." });
          fetchCostVariables();
          resetCostVariableForm();
          return;
        }
      } catch {
        // Fallback to Supabase
      }

      if (user) {
        const { error } = await supabase
          .from("cost_variables")
          .update({
            name: costVariableFormData.name,
            code: costVariableFormData.code,
            value: costVariableFormData.value,
            description: costVariableFormData.description
          })
          .eq("id", editingCostVariable.id);

        if (error) {
          toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Variável atualizada", description: "A variável foi atualizada com sucesso." });
          fetchCostVariables();
        }
      }
    } else {
      if (user) {
        const { error } = await supabase
          .from("cost_variables")
          .insert({
            name: costVariableFormData.name,
            code: costVariableFormData.code,
            value: costVariableFormData.value,
            description: costVariableFormData.description
          });

        if (error) {
          toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Variável criada", description: "A variável foi criada com sucesso." });
          fetchCostVariables();
        }
      }
    }

    resetCostVariableForm();
  };`;

costVarsContent = costVarsContent.replace(costSubmitRegex, newCostSubmit);
fs.writeFileSync(costVarsFilePath, costVarsContent, 'utf8');
console.log('✅ useCostVariables.ts updated with Backend mutations + Supabase fallback');


// ==========================================
// 3. UPDATE useServices.ts
// ==========================================
const servicesFilePath = path.join(frontendDir, 'src/hooks/useServices.ts');
let servicesContent = fs.readFileSync(servicesFilePath, 'utf8');

const serviceSubmitRegex = /const handleServiceSubmit = async \(e: FormEvent\) => \{[\s\S]*?resetServiceForm\(\);\s*\};/;
const newServiceSubmit = `const handleServiceSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (editingService) {
      try {
        const updated = await api.put<any>(\`/services/\${editingService.id}\`, {
          name: serviceFormData.name,
          value_per_alqueire: serviceFormData.valuePerAlqueire,
          status: serviceFormData.status,
          products: serviceFormData.products
        });
        if (updated) {
          toast({ title: "Serviço atualizado", description: "O serviço foi atualizado com sucesso." });
          fetchServices();
          resetServiceForm();
          return;
        }
      } catch {
        // Fallback to Supabase
      }

      if (user) {
        const { error } = await supabase
          .from("services")
          .update({
            name: serviceFormData.name,
            value_per_alqueire: serviceFormData.valuePerAlqueire,
            status: serviceFormData.status,
            products: serviceFormData.products
          })
          .eq("id", editingService.id);

        if (error) {
          toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Serviço atualizado", description: "O serviço foi atualizado com sucesso." });
          fetchServices();
        }
      }
    } else {
      try {
        const created = await api.post<any>('/services', {
          name: serviceFormData.name,
          value_per_alqueire: serviceFormData.valuePerAlqueire,
          status: serviceFormData.status,
          products: serviceFormData.products
        });
        if (created) {
          toast({ title: "Serviço criado", description: "O serviço foi criado com sucesso." });
          fetchServices();
          resetServiceForm();
          return;
        }
      } catch {
        // Fallback to Supabase
      }

      if (user) {
        const { error } = await supabase
          .from("services")
          .insert({
            user_id: user.id,
            name: serviceFormData.name,
            value_per_alqueire: serviceFormData.valuePerAlqueire,
            status: serviceFormData.status,
            products: serviceFormData.products
          });

        if (error) {
          toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Serviço criado", description: "O serviço foi criado com sucesso." });
          fetchServices();
        }
      }
    }

    resetServiceForm();
  };`;

const serviceDeleteRegex = /const handleDeleteService = async \(id: string\) => \{[\s\S]*?fetchServices\(\);\s*\}\s*\};/;
const newServiceDelete = `const handleDeleteService = async (id: string) => {
    try {
      await api.delete(\`/services/\${id}\`);
      toast({ title: "Serviço excluído", description: "O serviço foi excluído com sucesso." });
      fetchServices();
      return;
    } catch {
      // Fallback to Supabase
    }

    if (!user) return;

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Serviço excluído", description: "O serviço foi excluído com sucesso." });
      fetchServices();
    }
  };`;

servicesContent = servicesContent.replace(serviceSubmitRegex, newServiceSubmit);
servicesContent = servicesContent.replace(serviceDeleteRegex, newServiceDelete);
fs.writeFileSync(servicesFilePath, servicesContent, 'utf8');
console.log('✅ useServices.ts updated with Backend mutations + Supabase fallback');


// ==========================================
// 4. UPDATE useProducts.ts
// ==========================================
const productsFilePath = path.join(frontendDir, 'src/hooks/useProducts.ts');
let productsContent = fs.readFileSync(productsFilePath, 'utf8');

// Ensure api import
if (!productsContent.includes('api')) {
  productsContent = productsContent.replace(
    'import { useAuth } from "@/hooks/useAuth";',
    'import { useAuth } from "@/hooks/useAuth";\nimport { api } from "@/services/api";'
  );
}

const fetchProductsRegex = /const fetchProducts = async \(\) => \{[\s\S]*?setLoading\(false\);\s*\};/;
const newFetchProducts = `const fetchProducts = async () => {
    setLoading(true);

    try {
      const backendProducts = await api.get<any[]>('/products');
      if (Array.isArray(backendProducts)) {
        setProducts(backendProducts.map(p => ({
          id: p.id,
          name: p.name,
          unitValue: p.price?.toString() || p.unit_value || "",
          status: p.status || "Ativo"
        })));
        setLoading(false);
        return;
      }
    } catch {
      // Fallback to Supabase
    }

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar produtos", description: error.message, variant: "destructive" });
    } else {
      setProducts(data?.map(p => ({
        id: p.id,
        name: p.name,
        unitValue: p.unit_value || "",
        status: p.status || "Ativo"
      })) || []);
    }
    setLoading(false);
  };`;

const productSubmitRegex = /const handleProductSubmit = async \(e: FormEvent\) => \{[\s\S]*?resetProductForm\(\);\s*\};/;
const newProductSubmit = `const handleProductSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (editingProduct) {
      try {
        const price = parseFloat(productFormData.unitValue) || 0;
        const updated = await api.put<any>(\`/products/\${editingProduct.id}\`, {
          name: productFormData.name,
          price,
          quantity: 100
        });
        if (updated) {
          toast({ title: "Produto atualizado", description: "O produto foi atualizado com sucesso." });
          fetchProducts();
          resetProductForm();
          return;
        }
      } catch {
        // Fallback to Supabase
      }

      if (user) {
        const { error } = await supabase
          .from("products")
          .update({
            name: productFormData.name,
            unit_value: productFormData.unitValue,
            status: productFormData.status
          })
          .eq("id", editingProduct.id);

        if (error) {
          toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Produto atualizado", description: "O produto foi atualizado com sucesso." });
          fetchProducts();
        }
      }
    } else {
      try {
        const price = parseFloat(productFormData.unitValue) || 0;
        const created = await api.post<any>('/products', {
          name: productFormData.name,
          price,
          quantity: 100
        });
        if (created) {
          toast({ title: "Produto criado", description: "O produto foi criado com sucesso." });
          fetchProducts();
          resetProductForm();
          return;
        }
      } catch {
        // Fallback to Supabase
      }

      if (user) {
        const { error } = await supabase
          .from("products")
          .insert({
            user_id: user.id,
            name: productFormData.name,
            unit_value: productFormData.unitValue,
            status: productFormData.status
          });

        if (error) {
          toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Produto criado", description: "O produto foi criado com sucesso." });
          fetchProducts();
        }
      }
    }

    resetProductForm();
  };`;

const productDeleteRegex = /const handleDeleteProduct = async \(id: string\) => \{[\s\S]*?fetchProducts\(\);\s*\}\s*\};/;
const newProductDelete = `const handleDeleteProduct = async (id: string) => {
    try {
      await api.delete(\`/products/\${id}\`);
      toast({ title: "Produto excluído", description: "O produto foi excluído com sucesso." });
      fetchProducts();
      return;
    } catch {
      // Fallback to Supabase
    }

    if (!user) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Produto excluído", description: "O produto foi excluído com sucesso." });
      fetchProducts();
    }
  };`;

productsContent = productsContent.replace(fetchProductsRegex, newFetchProducts);
productsContent = productsContent.replace(productSubmitRegex, newProductSubmit);
productsContent = productsContent.replace(productDeleteRegex, newProductDelete);
fs.writeFileSync(productsFilePath, productsContent, 'utf8');
console.log('✅ useProducts.ts updated with Backend mutations + Supabase fallback');
