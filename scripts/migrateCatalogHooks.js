const fs = require('fs');

// 1. useServices.ts
const useServicesContent = `import { useState, useEffect, FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";

export interface Service {
  id: string;
  name: string;
  valuePerAlqueire: string;
  status: string;
  products: string;
  isFixed: boolean;
}

export const useServices = () => {
  const { toast } = useToast();
  
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicesPage, setServicesPage] = useState(1);
  const [servicesPerPage, setServicesPerPage] = useState(10);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceFormData, setServiceFormData] = useState<Service>({
    id: "",
    name: "",
    valuePerAlqueire: "",
    status: "Ativo",
    products: "",
    isFixed: false
  });

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await api.get<any[]>('/services');
      if (Array.isArray(data)) {
        setServices(data.map(s => ({
          id: s.id,
          name: s.name,
          valuePerAlqueire: s.value_per_alqueire || s.valuePerAlqueire || "",
          status: s.status || "Ativo",
          products: s.products || "",
          isFixed: s.is_fixed || s.isFixed || false
        })));
      }
    } catch (err: any) {
      toast({ title: "Erro ao carregar serviços", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setServiceFormData(service);
    setShowServiceForm(true);
  };

  const handleServiceSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: serviceFormData.name,
        value_per_alqueire: serviceFormData.valuePerAlqueire,
        status: serviceFormData.status,
        products: serviceFormData.products,
        is_fixed: serviceFormData.isFixed
      };

      if (editingService) {
        await api.put(\`/services/\${editingService.id}\`, payload);
        toast({ title: "Serviço atualizado", description: "O serviço foi atualizado com sucesso." });
      } else {
        await api.post('/services', payload);
        toast({ title: "Serviço criado", description: "O serviço foi criado com sucesso." });
      }
      fetchServices();
      resetServiceForm();
    } catch (err: any) {
      toast({ title: "Erro ao salvar serviço", description: err.message, variant: "destructive" });
    }
  };

  const resetServiceForm = () => {
    setServiceFormData({
      id: "",
      name: "",
      valuePerAlqueire: "",
      status: "Ativo",
      products: "",
      isFixed: false
    });
    setEditingService(null);
    setShowServiceForm(false);
  };

  const handleDeleteService = async (id: string) => {
    try {
      await api.delete(\`/services/\${id}\`);
      toast({ title: "Serviço excluído", description: "O serviço foi excluído com sucesso." });
      fetchServices();
    } catch (err: any) {
      toast({ title: "Erro ao excluir serviço", description: err.message, variant: "destructive" });
    }
  };

  const handleServiceInputChange = (field: keyof Service, value: string | boolean) => {
    setServiceFormData(prev => ({ ...prev, [field]: value }));
  };

  const totalServices = services.length;
  const totalServicesPages = Math.ceil(totalServices / servicesPerPage);
  const servicesStartIndex = (servicesPage - 1) * servicesPerPage;
  const servicesEndIndex = servicesStartIndex + servicesPerPage;
  const currentServices = services.slice(servicesStartIndex, servicesEndIndex);

  return {
    services,
    loading,
    servicesPage,
    setServicesPage,
    servicesPerPage,
    setServicesPerPage,
    showServiceForm,
    setShowServiceForm,
    editingService,
    serviceFormData,
    handleEditService,
    handleServiceSubmit,
    resetServiceForm,
    handleServiceInputChange,
    handleDeleteService,
    totalServices,
    totalServicesPages,
    servicesStartIndex,
    servicesEndIndex,
    currentServices,
    fetchServices
  };
};
`;

fs.writeFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/hooks/useServices.ts', useServicesContent);
console.log('useServices.ts updated.');

// 2. useProducts.ts
const useProductsContent = `import { useState, useEffect, FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";

export interface Product {
  id: string;
  name: string;
  supplier: string;
  valuePerUnit: number;
  unit: string;
  status: string;
}

export const useProducts = () => {
  const { toast } = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsPage, setProductsPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(10);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormData, setProductFormData] = useState<Product>({
    id: "",
    name: "",
    supplier: "",
    valuePerUnit: 0,
    unit: "",
    status: "Ativo"
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.get<any[]>('/products');
      if (Array.isArray(data)) {
        setProducts(data.map(p => ({
          id: p.id,
          name: p.name,
          supplier: p.supplier || "",
          valuePerUnit: Number(p.value_per_unit || p.valuePerUnit || 0),
          unit: p.unit || "",
          status: p.status || "Ativo"
        })));
      }
    } catch (err: any) {
      toast({ title: "Erro ao carregar produtos", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductFormData(product);
    setShowProductForm(true);
  };

  const handleProductSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: productFormData.name,
        supplier: productFormData.supplier,
        value_per_unit: productFormData.valuePerUnit,
        unit: productFormData.unit,
        status: productFormData.status
      };

      if (editingProduct) {
        await api.put(\`/products/\${editingProduct.id}\`, payload);
        toast({ title: "Produto atualizado", description: "O produto foi atualizado com sucesso." });
      } else {
        await api.post('/products', payload);
        toast({ title: "Produto criado", description: "O produto foi criado com sucesso." });
      }
      fetchProducts();
      resetProductForm();
    } catch (err: any) {
      toast({ title: "Erro ao salvar produto", description: err.message, variant: "destructive" });
    }
  };

  const resetProductForm = () => {
    setProductFormData({
      id: "",
      name: "",
      supplier: "",
      valuePerUnit: 0,
      unit: "",
      status: "Ativo"
    });
    setEditingProduct(null);
    setShowProductForm(false);
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await api.delete(\`/products/\${id}\`);
      toast({ title: "Produto excluído", description: "O produto foi excluído com sucesso." });
      fetchProducts();
    } catch (err: any) {
      toast({ title: "Erro ao excluir produto", description: err.message, variant: "destructive" });
    }
  };

  const handleProductInputChange = (field: keyof Product, value: string | number) => {
    setProductFormData(prev => ({ ...prev, [field]: value }));
  };

  const totalProducts = products.length;
  const totalProductsPages = Math.ceil(totalProducts / productsPerPage);
  const productsStartIndex = (productsPage - 1) * productsPerPage;
  const productsEndIndex = productsStartIndex + productsPerPage;
  const currentProducts = products.slice(productsStartIndex, productsEndIndex);

  return {
    products,
    loading,
    productsPage,
    setProductsPage,
    productsPerPage,
    setProductsPerPage,
    showProductForm,
    setShowProductForm,
    editingProduct,
    productFormData,
    handleEditProduct,
    handleProductSubmit,
    resetProductForm,
    handleProductInputChange,
    handleDeleteProduct,
    totalProducts,
    totalProductsPages,
    productsStartIndex,
    productsEndIndex,
    currentProducts,
    fetchProducts
  };
};
`;

fs.writeFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/hooks/useProducts.ts', useProductsContent);
console.log('useProducts.ts updated.');

// 3. useCostVariables.ts
const useCostVariablesContent = `import { useState, useEffect, FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";

export interface CostVariable {
  id: string;
  name: string;
  code: string;
  value: number;
  description: string;
  linkedServices?: string[];
}

export const useCostVariables = () => {
  const { toast } = useToast();
  
  const [costVariables, setCostVariables] = useState<CostVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [costVariablesPage, setCostVariablesPage] = useState(1);
  const [costVariablesPerPage, setCostVariablesPerPage] = useState(10);
  const [showCostVariableForm, setShowCostVariableForm] = useState(false);
  const [editingCostVariable, setEditingCostVariable] = useState<CostVariable | null>(null);
  const [costVariableFormData, setCostVariableFormData] = useState<CostVariable>({
    id: "",
    name: "",
    code: "",
    value: 0,
    description: "",
    linkedServices: []
  });

  const fetchCostVariables = async () => {
    setLoading(true);
    try {
      const data = await api.get<any[]>('/cost-variables');
      if (Array.isArray(data)) {
        setCostVariables(data.map(c => ({
          id: c.id,
          name: c.name,
          code: c.code || "",
          value: Number(c.value || 0),
          description: c.description || "",
          linkedServices: c.linked_services || c.linkedServices || []
        })));
      }
    } catch (err: any) {
      toast({ title: "Erro ao carregar variáveis", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCostVariables();
  }, []);

  const handleEditCostVariable = (variable: CostVariable) => {
    setEditingCostVariable(variable);
    setCostVariableFormData(variable);
    setShowCostVariableForm(true);
  };

  const handleCostVariableSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: costVariableFormData.name,
        code: costVariableFormData.code,
        value: costVariableFormData.value,
        description: costVariableFormData.description,
        linked_services: costVariableFormData.linkedServices
      };

      if (editingCostVariable) {
        await api.put(\`/cost-variables/\${editingCostVariable.id}\`, payload);
        toast({ title: "Variável atualizada", description: "A variável foi atualizada com sucesso." });
      } else {
        await api.post('/cost-variables', payload);
        toast({ title: "Variável criada", description: "A variável foi criada com sucesso." });
      }
      fetchCostVariables();
      resetCostVariableForm();
    } catch (err: any) {
      toast({ title: "Erro ao salvar variável", description: err.message, variant: "destructive" });
    }
  };

  const resetCostVariableForm = () => {
    setCostVariableFormData({
      id: "",
      name: "",
      code: "",
      value: 0,
      description: "",
      linkedServices: []
    });
    setEditingCostVariable(null);
    setShowCostVariableForm(false);
  };

  const handleDeleteCostVariable = async (id: string) => {
    try {
      await api.delete(\`/cost-variables/\${id}\`);
      toast({ title: "Variável excluída", description: "A variável foi excluída com sucesso." });
      fetchCostVariables();
    } catch (err: any) {
      toast({ title: "Erro ao excluir variável", description: err.message, variant: "destructive" });
    }
  };

  const handleCostVariableInputChange = (field: keyof CostVariable, value: string | number) => {
    setCostVariableFormData(prev => ({ ...prev, [field]: value }));
  };

  const totalCostVariables = costVariables.length;
  const totalCostVariablesPages = Math.ceil(totalCostVariables / costVariablesPerPage);
  const costVariablesStartIndex = (costVariablesPage - 1) * costVariablesPerPage;
  const costVariablesEndIndex = costVariablesStartIndex + costVariablesPerPage;
  const currentCostVariables = costVariables.slice(costVariablesStartIndex, costVariablesEndIndex);

  return {
    costVariables,
    loading,
    costVariablesPage,
    setCostVariablesPage,
    costVariablesPerPage,
    setCostVariablesPerPage,
    showCostVariableForm,
    setShowCostVariableForm,
    editingCostVariable,
    costVariableFormData,
    handleEditCostVariable,
    handleCostVariableSubmit,
    resetCostVariableForm,
    handleCostVariableInputChange,
    handleDeleteCostVariable,
    totalCostVariables,
    totalCostVariablesPages,
    costVariablesStartIndex,
    costVariablesEndIndex,
    currentCostVariables,
    fetchCostVariables
  };
};
`;

fs.writeFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/hooks/useCostVariables.ts', useCostVariablesContent);
console.log('useCostVariables.ts updated.');

// 4. useServiceGroups.ts
const useServiceGroupsContent = `import { useState, useEffect, FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";

export interface ServiceGroup {
  id: string;
  name: string;
  description: string;
  servicesIds: string[];
  status: string;
}

export const useServiceGroups = () => {
  const { toast } = useToast();

  const [serviceGroups, setServiceGroups] = useState<ServiceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceGroupsPage, setServiceGroupsPage] = useState(1);
  const [serviceGroupsPerPage, setServiceGroupsPerPage] = useState(10);
  const [showServiceGroupForm, setShowServiceGroupForm] = useState(false);
  const [editingServiceGroup, setEditingServiceGroup] = useState<ServiceGroup | null>(null);
  const [serviceGroupFormData, setServiceGroupFormData] = useState<ServiceGroup>({
    id: "",
    name: "",
    description: "",
    servicesIds: [],
    status: "Ativo"
  });

  const fetchServiceGroups = async () => {
    setLoading(true);
    try {
      const data = await api.get<any[]>('/service-groups');
      if (Array.isArray(data)) {
        setServiceGroups(data.map(g => ({
          id: g.id,
          name: g.name,
          description: g.description || "",
          servicesIds: g.services_ids || g.servicesIds || [],
          status: g.status || "Ativo"
        })));
      }
    } catch (err: any) {
      toast({ title: "Erro ao carregar grupos", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceGroups();
  }, []);

  const handleEditServiceGroup = (group: ServiceGroup) => {
    setEditingServiceGroup(group);
    setServiceGroupFormData(group);
    setShowServiceGroupForm(true);
  };

  const handleServiceGroupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: serviceGroupFormData.name,
        description: serviceGroupFormData.description,
        services_ids: serviceGroupFormData.servicesIds,
        status: serviceGroupFormData.status
      };

      if (editingServiceGroup) {
        await api.put(\`/service-groups/\${editingServiceGroup.id}\`, payload);
        toast({ title: "Grupo atualizado", description: "O grupo de serviços foi atualizado com sucesso." });
      } else {
        await api.post('/service-groups', payload);
        toast({ title: "Grupo criado", description: "O grupo de serviços foi criado com sucesso." });
      }
      fetchServiceGroups();
      resetServiceGroupForm();
    } catch (err: any) {
      toast({ title: "Erro ao salvar grupo", description: err.message, variant: "destructive" });
    }
  };

  const resetServiceGroupForm = () => {
    setServiceGroupFormData({
      id: "",
      name: "",
      description: "",
      servicesIds: [],
      status: "Ativo"
    });
    setEditingServiceGroup(null);
    setShowServiceGroupForm(false);
  };

  const handleDeleteServiceGroup = async (id: string) => {
    try {
      await api.delete(\`/service-groups/\${id}\`);
      toast({ title: "Grupo excluído", description: "O grupo de serviços foi excluído com sucesso." });
      fetchServiceGroups();
    } catch (err: any) {
      toast({ title: "Erro ao excluir grupo", description: err.message, variant: "destructive" });
    }
  };

  const handleServiceGroupInputChange = (field: keyof ServiceGroup, value: string | string[]) => {
    setServiceGroupFormData(prev => ({ ...prev, [field]: value }));
  };

  const totalServiceGroups = serviceGroups.length;
  const totalServiceGroupsPages = Math.ceil(totalServiceGroups / serviceGroupsPerPage);
  const serviceGroupsStartIndex = (serviceGroupsPage - 1) * serviceGroupsPerPage;
  const serviceGroupsEndIndex = serviceGroupsStartIndex + serviceGroupsPerPage;
  const currentServiceGroups = serviceGroups.slice(serviceGroupsStartIndex, serviceGroupsEndIndex);

  return {
    serviceGroups,
    loading,
    serviceGroupsPage,
    setServiceGroupsPage,
    serviceGroupsPerPage,
    setServiceGroupsPerPage,
    showServiceGroupForm,
    setShowServiceGroupForm,
    editingServiceGroup,
    serviceGroupFormData,
    handleEditServiceGroup,
    handleServiceGroupSubmit,
    resetServiceGroupForm,
    handleServiceGroupInputChange,
    handleDeleteServiceGroup,
    totalServiceGroups,
    totalServiceGroupsPages,
    serviceGroupsStartIndex,
    serviceGroupsEndIndex,
    currentServiceGroups,
    fetchServiceGroups
  };
};
`;

fs.writeFileSync('c:/Users/User/Documents/Projects/farm-flow-frontend/src/hooks/useServiceGroups.ts', useServiceGroupsContent);
console.log('useServiceGroups.ts updated.');
