const fs = require('fs');
const path = require('path');

const frontendRoot = 'C:/Users/User/Documents/Projects/farm-flow-frontend';

// 1. useCollaborators.ts
const useCollaboratorsCode = `import { useState, useEffect, FormEvent } from "react";
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
  const [collaboratorsPage, setCollaboratorsPage] = useState(1);
  const [collaboratorsPerPage, setCollaboratorsPerPage] = useState(10);
  const [showCollaboratorForm, setShowCollaboratorForm] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);
  const [collaboratorFormData, setCollaboratorFormData] = useState<Collaborator>({
    id: "",
    name: "",
    role: "Operador de Campo",
    phone: "",
    email: "",
    status: "Ativo"
  });

  const fetchCollaborators = async () => {
    setLoading(true);
    try {
      const data = await api.get<any[]>('/collaborators');
      if (Array.isArray(data)) {
        setCollaborators(data.map(c => ({
          id: c.id,
          name: c.name || "",
          role: c.role || "Operador",
          phone: c.phone || "",
          email: c.email || "",
          status: c.status || "Ativo"
        })));
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

  const handleCollaboratorInputChange = (field: keyof Collaborator, value: any) => {
    setCollaboratorFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCollaboratorSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: collaboratorFormData.name,
        role: collaboratorFormData.role,
        phone: collaboratorFormData.phone,
        email: collaboratorFormData.email,
        status: collaboratorFormData.status
      };

      if (editingCollaborator) {
        await api.put(\`/collaborators/\${editingCollaborator.id}\`, payload);
        toast({ title: "Colaborador atualizado", description: "Dados atualizados com sucesso." });
      } else {
        await api.post('/collaborators', payload);
        toast({ title: "Colaborador adicionado", description: "Colaborador cadastrado com sucesso." });
      }
      resetCollaboratorForm();
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

  const resetCollaboratorForm = () => {
    setShowCollaboratorForm(false);
    setEditingCollaborator(null);
    setCollaboratorFormData({ id: "", name: "", role: "Operador de Campo", phone: "", email: "", status: "Ativo" });
  };

  const totalCollaborators = collaborators.length;
  const totalCollaboratorsPages = Math.max(1, Math.ceil(totalCollaborators / (collaboratorsPerPage || 10)));
  const safePage = Math.min(collaboratorsPage, totalCollaboratorsPages);
  const collaboratorsStartIndex = (safePage - 1) * (collaboratorsPerPage || 10);
  const collaboratorsEndIndex = collaboratorsStartIndex + (collaboratorsPerPage || 10);
  const paginatedCollaborators = collaborators.slice(collaboratorsStartIndex, collaboratorsEndIndex);

  return {
    collaborators: paginatedCollaborators,
    allCollaborators: collaborators,
    loading,
    collaboratorsPage: safePage,
    setCollaboratorsPage,
    collaboratorPage: safePage,
    setCollaboratorPage: setCollaboratorsPage,
    collaboratorsPerPage,
    setCollaboratorsPerPage,
    collaboratorPerPage: collaboratorsPerPage,
    setCollaboratorPerPage: setCollaboratorsPerPage,
    totalCollaborators,
    totalCollaboratorsPages,
    collaboratorsStartIndex,
    collaboratorsEndIndex,
    showCollaboratorForm,
    setShowCollaboratorForm,
    editingCollaborator,
    setEditingCollaborator,
    collaboratorFormData,
    setCollaboratorFormData,
    handleCollaboratorInputChange,
    handleInputChange: handleCollaboratorInputChange,
    handleCollaboratorSubmit,
    handleSaveCollaborator: handleCollaboratorSubmit,
    handleEditCollaborator,
    handleDeleteCollaborator,
    resetCollaboratorForm,
    refetch: fetchCollaborators
  };
};
`;

// 2. useEquipment.ts
const useEquipmentCode = `import { useState, useEffect, FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";

export interface Equipment {
  id: string;
  name: string;
  type?: string;
  model?: string;
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
    type: "Geral",
    model: "",
    status: "Disponível"
  });

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const data = await api.get<any[]>('/equipment');
      if (Array.isArray(data)) {
        setEquipment(data.map(e => ({
          id: e.id,
          name: e.name || "",
          type: e.type || "Geral",
          model: e.model || "",
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

  const handleEquipmentInputChange = (field: keyof Equipment, value: any) => {
    setEquipmentFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEquipmentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: equipmentFormData.name,
        type: equipmentFormData.type || "Geral",
        model: equipmentFormData.model || "",
        status: equipmentFormData.status
      };

      if (editingEquipment) {
        await api.put(\`/equipment/\${editingEquipment.id}\`, payload);
        toast({ title: "Equipamento atualizado", description: "O equipamento foi atualizado com sucesso." });
      } else {
        await api.post('/equipment', payload);
        toast({ title: "Equipamento adicionado", description: "O equipamento foi adicionado com sucesso." });
      }
      resetEquipmentForm();
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

  const resetEquipmentForm = () => {
    setShowEquipmentForm(false);
    setEditingEquipment(null);
    setEquipmentFormData({ id: "", name: "", type: "Geral", model: "", status: "Disponível" });
  };

  const totalEquipment = equipment.length;
  const totalEquipmentPages = Math.max(1, Math.ceil(totalEquipment / (equipmentPerPage || 10)));
  const safePage = Math.min(equipmentPage, totalEquipmentPages);
  const equipmentStartIndex = (safePage - 1) * (equipmentPerPage || 10);
  const equipmentEndIndex = equipmentStartIndex + (equipmentPerPage || 10);
  const paginatedEquipment = equipment.slice(equipmentStartIndex, equipmentEndIndex);

  return {
    equipment: paginatedEquipment,
    allEquipment: equipment,
    loading,
    equipmentPage: safePage,
    setEquipmentPage,
    equipmentPerPage,
    setEquipmentPerPage,
    totalEquipment,
    totalEquipmentPages,
    equipmentStartIndex,
    equipmentEndIndex,
    showEquipmentForm,
    setShowEquipmentForm,
    editingEquipment,
    setEditingEquipment,
    equipmentFormData,
    setEquipmentFormData,
    handleEquipmentInputChange,
    handleInputChange: handleEquipmentInputChange,
    handleEquipmentSubmit,
    handleSaveEquipment: handleEquipmentSubmit,
    handleEditEquipment,
    handleDeleteEquipment,
    resetEquipmentForm,
    refetch: fetchEquipment
  };
};
`;

// 3. CollaboratorsTab.tsx
const collaboratorsTabCode = `import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Phone, Mail, UserCheck } from "lucide-react";
import { Collaborator } from "../../../hooks/useCollaborators";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface CollaboratorsTabProps {
  collaborators: Collaborator[];
  collaboratorsStartIndex?: number;
  collaboratorsEndIndex?: number;
  totalCollaborators?: number;
  collaboratorsPerPage?: number;
  setCollaboratorsPerPage?: (value: number) => void;
  collaboratorsPage?: number;
  setCollaboratorsPage?: (value: number) => void;
  totalCollaboratorsPages?: number;
  setShowCollaboratorForm: (show: boolean) => void;
  setEditingCollaborator?: (collaborator: Collaborator | null) => void;
  setCollaboratorFormData?: (data: Collaborator) => void;
  handleEditCollaborator?: (collaborator: Collaborator) => void;
  handleDeleteCollaborator: (id: string) => void;
}

export const CollaboratorsTab = ({
  collaborators = [],
  collaboratorsStartIndex = 0,
  collaboratorsEndIndex = 10,
  totalCollaborators = 0,
  collaboratorsPerPage = 10,
  setCollaboratorsPerPage,
  collaboratorsPage = 1,
  setCollaboratorsPage,
  totalCollaboratorsPages = 1,
  setShowCollaboratorForm,
  setEditingCollaborator,
  setCollaboratorFormData,
  handleEditCollaborator: onEdit,
  handleDeleteCollaborator
}: CollaboratorsTabProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [collaboratorToDelete, setCollaboratorToDelete] = useState<string | null>(null);

  const handleEdit = (collaborator: Collaborator) => {
    if (onEdit) {
      onEdit(collaborator);
    } else {
      if (setEditingCollaborator) setEditingCollaborator(collaborator);
      if (setCollaboratorFormData) setCollaboratorFormData(collaborator);
      setShowCollaboratorForm(true);
    }
  };

  const openDeleteDialog = (id: string) => {
    setCollaboratorToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (collaboratorToDelete) {
      handleDeleteCollaborator(collaboratorToDelete);
      setCollaboratorToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl">Colaboradores e Equipe</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Operadores, pilotos de drone e agrônomos de campo</p>
          </div>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setShowCollaboratorForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Colaborador
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Função / Cargo</TableHead>
                    <TableHead>Telefone / WhatsApp</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collaborators.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        Nenhum colaborador cadastrado. Clique em "Novo Colaborador" para adicionar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    collaborators.map((collaborator) => (
                      <TableRow key={collaborator.id}>
                        <TableCell className="font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-primary" />
                            {collaborator.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal bg-muted/40">
                            {collaborator.role || "Operador"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {collaborator.phone || "-"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {collaborator.email || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={collaborator.status === "Ativo" ? "default" : "secondary"} className={collaborator.status === "Ativo" ? "bg-green-600" : ""}>
                            {collaborator.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(collaborator)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(collaborator.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  Mostrando {totalCollaborators > 0 ? collaboratorsStartIndex + 1 : 0} a {Math.min(collaboratorsEndIndex, totalCollaborators)} de {totalCollaborators} colaboradores
                </span>
                {setCollaboratorsPerPage && (
                  <>
                    <Select value={(collaboratorsPerPage || 10).toString()} onValueChange={(value) => {
                      setCollaboratorsPerPage(Number(value));
                      if (setCollaboratorsPage) setCollaboratorsPage(1);
                    }}>
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-gray-600">por página</span>
                  </>
                )}
              </div>
              
              {totalCollaboratorsPages > 1 && setCollaboratorsPage && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCollaboratorsPage(Math.max(1, collaboratorsPage - 1))}
                        className={collaboratorsPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalCollaboratorsPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCollaboratorsPage(page)}
                          isActive={collaboratorsPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCollaboratorsPage(Math.min(totalCollaboratorsPages, collaboratorsPage + 1))}
                        className={collaboratorsPage === totalCollaboratorsPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Excluir colaborador"
        description="Tem certeza que deseja excluir este colaborador? Esta ação não pode ser desfeita."
      />
    </>
  );
};
`;

// 4. CollaboratorModal.tsx
const collaboratorModalCode = `import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collaborator } from "../../../hooks/useCollaborators";

interface CollaboratorModalProps {
  showCollaboratorForm: boolean;
  setShowCollaboratorForm: (show: boolean) => void;
  editingCollaborator: Collaborator | null;
  collaboratorFormData: Collaborator;
  handleCollaboratorInputChange: (field: keyof Collaborator, value: string) => void;
  handleCollaboratorSubmit: (e: React.FormEvent) => void;
  resetCollaboratorForm: () => void;
}

export const CollaboratorModal = ({
  showCollaboratorForm,
  setShowCollaboratorForm,
  editingCollaborator,
  collaboratorFormData,
  handleCollaboratorInputChange,
  handleCollaboratorSubmit,
  resetCollaboratorForm
}: CollaboratorModalProps) => {
  return (
    <Dialog open={showCollaboratorForm} onOpenChange={setShowCollaboratorForm}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {editingCollaborator ? "Editar Colaborador" : "Novo Colaborador"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCollaboratorSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              id="nome"
              placeholder="Ex: João da Silva"
              value={collaboratorFormData.name}
              onChange={(e) => handleCollaboratorInputChange("name", e.target.value)}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cargo">Função / Cargo</Label>
              <Input
                id="cargo"
                placeholder="Ex: Piloto de Drone, Operador"
                value={collaboratorFormData.role}
                onChange={(e) => handleCollaboratorInputChange("role", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={collaboratorFormData.status}
                onValueChange={(value) => handleCollaboratorInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone / WhatsApp</Label>
              <Input
                id="telefone"
                placeholder="(45) 99999-9999"
                value={collaboratorFormData.phone}
                onChange={(e) => handleCollaboratorInputChange("phone", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@preciza.com.br"
                value={collaboratorFormData.email}
                onChange={(e) => handleCollaboratorInputChange("email", e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="outline" onClick={resetCollaboratorForm}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              {editingCollaborator ? "Atualizar" : "Salvar Colaborador"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
`;

// 5. EquipmentsTab.tsx
const equipmentsTabPath = path.join(frontendRoot, 'src/components/pages/settings/EquipmentsTab.tsx');
let equipmentsTabContent = fs.readFileSync(equipmentsTabPath, 'utf8');
equipmentsTabContent = equipmentsTabContent.replace(
  'equipmentPerPage.toString()',
  '(equipmentPerPage || 10).toString()'
);

fs.writeFileSync(path.join(frontendRoot, 'src/hooks/useCollaborators.ts'), useCollaboratorsCode);
fs.writeFileSync(path.join(frontendRoot, 'src/hooks/useEquipment.ts'), useEquipmentCode);
fs.writeFileSync(path.join(frontendRoot, 'src/components/pages/settings/CollaboratorsTab.tsx'), collaboratorsTabCode);
fs.writeFileSync(path.join(frontendRoot, 'src/components/pages/settings/CollaboratorModal.tsx'), collaboratorModalCode);
fs.writeFileSync(equipmentsTabPath, equipmentsTabContent);

console.log('Successfully patched useCollaborators, useEquipment, CollaboratorsTab, CollaboratorModal, and EquipmentsTab!');
