const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../farm-flow-frontend/src/hooks/useClients.ts');

const clientCode = `import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";

export interface Client {
  id: string;
  cpf: string;
  name: string;
  birthDate: string;
  email: string;
  phone: string;
  zipCode: string;
  city: string;
  state: string;
  cadPro?: string;
}

interface ClientDB {
  id: string;
  user_id: string;
  cpf: string;
  name: string;
  birth_date: string | null;
  email: string | null;
  phone: string | null;
  zip_code: string | null;
  city: string | null;
  state: string | null;
  cad_pro: string | null;
  created_at: string;
  updated_at: string;
}

const mapFromDB = (db: ClientDB): Client => ({
  id: db.id,
  cpf: db.cpf,
  name: db.name,
  birthDate: db.birth_date || "",
  email: db.email || "",
  phone: db.phone || "",
  zipCode: db.zip_code || "",
  city: db.city || "",
  state: db.state || "",
  cadPro: db.cad_pro || ""
});

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchClients = async () => {
    try {
      const backendData = await api.get<any[]>('/clients');
      if (Array.isArray(backendData)) {
        setClients(backendData.map(mapFromDB));
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar clientes",
        description: error.message || "Erro na conexão com o servidor local.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const addClient = async (client: Omit<Client, 'id'>) => {
    try {
      const created = await api.post<any>('/clients', {
        cpf: client.cpf,
        name: client.name,
        birth_date: client.birthDate || null,
        email: client.email || null,
        phone: client.phone || null,
        zip_code: client.zipCode || null,
        city: client.city || null,
        state: client.state || null,
        cad_pro: client.cadPro || null
      });
      await fetchClients();
      toast({
        title: "Cliente cadastrado",
        description: "O cliente foi cadastrado com sucesso."
      });
      return created;
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar cliente",
        description: error.message || "Erro ao salvar cliente no banco.",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateClient = async (updatedClient: Client) => {
    try {
      await api.put<any>(\`/clients/\${updatedClient.id}\`, {
        cpf: updatedClient.cpf,
        name: updatedClient.name,
        birth_date: updatedClient.birthDate || null,
        email: updatedClient.email || null,
        phone: updatedClient.phone || null,
        zip_code: updatedClient.zipCode || null,
        city: updatedClient.city || null,
        state: updatedClient.state || null,
        cad_pro: updatedClient.cadPro || null
      });
      await fetchClients();
      toast({
        title: "Cliente atualizado",
        description: "O cliente foi atualizado com sucesso."
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar cliente",
        description: error.message || "Erro ao atualizar cliente.",
        variant: "destructive"
      });
    }
  };

  const deleteClient = async (clientId: string) => {
    try {
      await api.delete(\`/clients/\${clientId}\`);
      await fetchClients();
      toast({
        title: "Cliente removido",
        description: "O cliente foi excluído com sucesso."
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir cliente",
        description: error.message || "Erro ao excluir cliente.",
        variant: "destructive"
      });
    }
  };

  const startEditing = (client: Client) => {
    setEditingClient(client);
  };

  const stopEditing = () => {
    setEditingClient(null);
  };

  return {
    clients,
    editingClient,
    loading,
    addClient,
    updateClient,
    deleteClient,
    startEditing,
    stopEditing,
    refetch: fetchClients
  };
};
`;

fs.writeFileSync(targetPath, clientCode, 'utf8');
console.log('✅ useClients.ts converted 100% to backend REST API with zero Supabase dependencies!');
