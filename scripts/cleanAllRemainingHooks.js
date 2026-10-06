const fs = require('fs');
const path = require('path');

const hooksDir = path.resolve(__dirname, '../../farm-flow-frontend/src/hooks');

// 1. Clean useEquipment.ts
const eqPath = path.join(hooksDir, 'useEquipment.ts');
const eqCode = `import { useState, useEffect, FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";

export interface Equipment {
  id: string;
  name: string;
  status: string;
}

export const useEquipment = () => {
  const { toast } = useToast();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [equipmentPage, setEquipmentPage] = useState(1);
  const [equipmentPerPage, setEquipmentPerPage] = useState(10);
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [equipmentFormData, setEquipmentFormData] = useState<Equipment>({
    id: "",
    name: "",
    status: "Disponível"
  });

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const data = await api.get<any[]>('/equipment');
      if (Array.isArray(data)) {
        setEquipment(data.map(e => ({
          id: e.id,
          name: e.name,
          status: e.status || "Disponível"
        })));
      }
    } catch (error: any) {
      toast({ title: "Erro ao carregar equipamentos", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const handleInputChange = (field: keyof Equipment, value: any) => {
    setEquipmentFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEquipment = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingEquipment) {
        await api.put(\`/equipment/\${editingEquipment.id}\`, equipmentFormData);
        toast({ title: "Equipamento atualizado", description: "O equipamento foi atualizado com sucesso." });
      } else {
        await api.post('/equipment', equipmentFormData);
        toast({ title: "Equipamento adicionado", description: "O equipamento foi adicionado com sucesso." });
      }
      setShowEquipmentForm(false);
      setEditingEquipment(null);
      setEquipmentFormData({ id: "", name: "", status: "Disponível" });
      await fetchEquipment();
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    }
  };

  const handleEditEquipment = (item: Equipment) => {
    setEditingEquipment(item);
    setEquipmentFormData(item);
    setShowEquipmentForm(true);
  };

  const handleDeleteEquipment = async (id: string) => {
    try {
      await api.delete(\`/equipment/\${id}\`);
      toast({ title: "Equipamento removido", description: "Equipamento excluído com sucesso." });
      await fetchEquipment();
    } catch (error: any) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  };

  return {
    equipment,
    loading,
    equipmentPage,
    setEquipmentPage,
    equipmentPerPage,
    setEquipmentPerPage,
    showEquipmentForm,
    setShowEquipmentForm,
    editingEquipment,
    equipmentFormData,
    handleInputChange,
    handleSaveEquipment,
    handleEditEquipment,
    handleDeleteEquipment,
    refetch: fetchEquipment
  };
};
`;
fs.writeFileSync(eqPath, eqCode, 'utf8');
console.log('✅ useEquipment.ts updated with 100% backend API');

// 2. Clean useCollaborators.ts
const colPath = path.join(hooksDir, 'useCollaborators.ts');
const colCode = `import { useState, useEffect, FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";

export interface Collaborator {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  status: string;
}

export const useCollaborators = () => {
  const { toast } = useToast();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [collaboratorPage, setCollaboratorPage] = useState(1);
  const [collaboratorPerPage, setCollaboratorPerPage] = useState(10);
  const [showCollaboratorForm, setShowCollaboratorForm] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);
  const [collaboratorFormData, setCollaboratorFormData] = useState<Collaborator>({
    id: "",
    name: "",
    role: "Operador",
    phone: "",
    email: "",
    status: "Ativo"
  });

  const fetchCollaborators = async () => {
    setLoading(true);
    try {
      const data = await api.get<any[]>('/collaborators');
      if (Array.isArray(data)) {
        setCollaborators(data);
      }
    } catch (error: any) {
      toast({ title: "Erro ao carregar colaboradores", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaborators();
  }, []);

  const handleInputChange = (field: keyof Collaborator, value: any) => {
    setCollaboratorFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveCollaborator = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingCollaborator) {
        await api.put(\`/collaborators/\${editingCollaborator.id}\`, collaboratorFormData);
        toast({ title: "Colaborador atualizado", description: "Dados atualizados com sucesso." });
      } else {
        await api.post('/collaborators', collaboratorFormData);
        toast({ title: "Colaborador adicionado", description: "Colaborador cadastrado com sucesso." });
      }
      setShowCollaboratorForm(false);
      setEditingCollaborator(null);
      setCollaboratorFormData({ id: "", name: "", role: "Operador", phone: "", email: "", status: "Ativo" });
      await fetchCollaborators();
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    }
  };

  const handleEditCollaborator = (item: Collaborator) => {
    setEditingCollaborator(item);
    setCollaboratorFormData(item);
    setShowCollaboratorForm(true);
  };

  const handleDeleteCollaborator = async (id: string) => {
    try {
      await api.delete(\`/collaborators/\${id}\`);
      toast({ title: "Colaborador removido", description: "Excluído com sucesso." });
      await fetchCollaborators();
    } catch (error: any) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  };

  return {
    collaborators,
    loading,
    collaboratorPage,
    setCollaboratorPage,
    collaboratorPerPage,
    setCollaboratorPerPage,
    showCollaboratorForm,
    setShowCollaboratorForm,
    editingCollaborator,
    collaboratorFormData,
    handleInputChange,
    handleSaveCollaborator,
    handleEditCollaborator,
    handleDeleteCollaborator,
    refetch: fetchCollaborators
  };
};
`;
fs.writeFileSync(colPath, colCode, 'utf8');
console.log('✅ useCollaborators.ts updated with 100% backend API');

// 3. Clean useAnalyses.ts
const anPath = path.join(hooksDir, 'useAnalyses.ts');
const anCode = `import { useState, useEffect, FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";

export interface Analysis {
  id: string;
  name: string;
  type: "Soil" | "Leaf";
  collaborator: string;
  deadline: number;
  value: string;
  status: "Active" | "Inactive";
}

export const useAnalyses = () => {
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysesPage, setAnalysesPage] = useState(1);
  const [analysesPerPage, setAnalysesPerPage] = useState(10);
  const [showAnalysisForm, setShowAnalysisForm] = useState(false);
  const [editingAnalysis, setEditingAnalysis] = useState<Analysis | null>(null);
  const [analysisFormData, setAnalysisFormData] = useState<Analysis>({
    id: "",
    name: "",
    type: "Soil",
    collaborator: "",
    deadline: 0,
    value: "",
    status: "Active"
  });

  const fetchAnalyses = async () => {
    setLoading(true);
    try {
      const data = await api.get<any[]>('/analyses');
      if (Array.isArray(data)) {
        setAnalyses(data.map(a => ({
          id: a.id,
          name: a.name,
          type: a.type || "Soil",
          collaborator: a.collaborator || "",
          deadline: a.deadline || 0,
          value: a.value ? String(a.value) : "0,00",
          status: a.status || "Active"
        })));
      }
    } catch (error: any) {
      toast({ title: "Erro ao carregar análises", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const handleInputChange = (field: keyof Analysis, value: any) => {
    setAnalysisFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveAnalysis = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingAnalysis) {
        await api.put(\`/analyses/\${editingAnalysis.id}\`, analysisFormData);
        toast({ title: "Análise atualizada", description: "Dados atualizados com sucesso." });
      } else {
        await api.post('/analyses', analysisFormData);
        toast({ title: "Análise cadastrada", description: "Análise adicionada com sucesso." });
      }
      setShowAnalysisForm(false);
      setEditingAnalysis(null);
      setAnalysisFormData({ id: "", name: "", type: "Soil", collaborator: "", deadline: 0, value: "", status: "Active" });
      await fetchAnalyses();
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    }
  };

  const handleEditAnalysis = (item: Analysis) => {
    setEditingAnalysis(item);
    setAnalysisFormData(item);
    setShowAnalysisForm(true);
  };

  const handleDeleteAnalysis = async (id: string) => {
    try {
      await api.delete(\`/analyses/\${id}\`);
      toast({ title: "Análise removida", description: "Excluída com sucesso." });
      await fetchAnalyses();
    } catch (error: any) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  };

  return {
    analyses,
    loading,
    analysesPage,
    setAnalysesPage,
    analysesPerPage,
    setAnalysesPerPage,
    showAnalysisForm,
    setShowAnalysisForm,
    editingAnalysis,
    analysisFormData,
    handleInputChange,
    handleSaveAnalysis,
    handleEditAnalysis,
    handleDeleteAnalysis,
    refetch: fetchAnalyses
  };
};
`;
fs.writeFileSync(anPath, anCode, 'utf8');
console.log('✅ useAnalyses.ts updated with 100% backend API');

// 4. Clean useAuth.ts
const authPath = path.join(hooksDir, 'useAuth.ts');
const authCode = `import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string | null;
  role: string | null;
  avatar_url: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const initAuth = useCallback(() => {
    const localToken = localStorage.getItem('@FarmFlow:token');
    const localUserStr = localStorage.getItem('@FarmFlow:user');

    if (localToken && localUserStr) {
      try {
        const localUser = JSON.parse(localUserStr);
        setUser(localUser);
        setSession({ access_token: localToken, user: localUser });
        setProfile({
          id: localUser.id,
          user_id: localUser.id,
          name: localUser.name || 'Usuário',
          role: localUser.role || 'admin',
          avatar_url: localUser.avatar_url || null,
        });
      } catch {
        localStorage.removeItem('@FarmFlow:token');
        localStorage.removeItem('@FarmFlow:user');
        setUser(null);
        setSession(null);
        setProfile(null);
      }
    } else {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    initAuth();

    const handleCustomAuthChange = () => {
      initAuth();
    };
    window.addEventListener('@FarmFlow:authChange', handleCustomAuthChange);

    return () => {
      window.removeEventListener('@FarmFlow:authChange', handleCustomAuthChange);
    };
  }, [initAuth]);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const created = await api.post<any>('/users', { name, email, password });
      return { data: { user: created }, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const res = await api.post<{ user: any; token: string }>('/sessions', {
        email,
        password,
      });

      if (res && res.token && res.user) {
        localStorage.setItem('@FarmFlow:token', res.token);
        localStorage.setItem('@FarmFlow:user', JSON.stringify(res.user));
        setUser(res.user);
        setSession({ access_token: res.token, user: res.user });
        setProfile({
          id: res.user.id,
          user_id: res.user.id,
          name: res.user.name,
          role: res.user.role,
          avatar_url: res.user.avatar_url || null,
        });

        window.dispatchEvent(new CustomEvent('@FarmFlow:authChange'));
        return { data: { user: res.user, session: { access_token: res.token } }, error: null };
      }
      return { data: null, error: new Error('Credenciais inválidas.') };
    } catch (backendErr: any) {
      return { data: null, error: backendErr };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('@FarmFlow:token');
    localStorage.removeItem('@FarmFlow:user');
    setUser(null);
    setSession(null);
    setProfile(null);
    window.dispatchEvent(new CustomEvent('@FarmFlow:authChange'));
  };

  return {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshAuth: initAuth,
  };
};
`;
fs.writeFileSync(authPath, authCode, 'utf8');
console.log('✅ useAuth.ts updated with 100% backend API and zero Supabase dependencies!');
