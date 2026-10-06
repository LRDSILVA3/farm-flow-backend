const fs = require('fs');

const code = `import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IMaskInput } from "react-imask";
import { CityStateSelect } from "@/components/pages/farms/CityStateSelect";
import { useToast } from "@/hooks/use-toast";
import { Client } from "../../../hooks/useClients";
import { AlertCircle } from "lucide-react";

interface CustomersFormProps {
  editingClient: Client | null;
  onSave: (Client: Omit<Client, 'id'>) => void;
  onUpdate: (Client: Client) => void;
  onCancel: () => void;
}

export const CustomersForm = ({ editingClient, onSave, onUpdate, onCancel }: CustomersFormProps) => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    cpf: editingClient?.cpf || "",
    name: editingClient?.name || "",
    birthDate: editingClient?.birthDate || "",
    email: editingClient?.email || "",
    phone: editingClient?.phone || "",
    zipCode: editingClient?.zipCode || "",
    city: editingClient?.city || "",
    state: editingClient?.state || "",
    cadPro: editingClient?.cadPro || ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "O nome do cliente é obrigatório.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      toast({
        title: "Campo obrigatório pendente",
        description: "Preencha o nome do cliente para prosseguir.",
        variant: "destructive"
      });
      return;
    }

    if (editingClient) {
      onUpdate({ ...formData, id: editingClient.id });
      toast({ title: "Cliente atualizado com sucesso!" });
    } else {
      onSave(formData);
      toast({ title: "Cliente cadastrado com sucesso!" });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      cpf: "",
      name: "",
      birthDate: "",
      email: "",
      phone: "",
      zipCode: "",
      city: "",
      state: "",
      cadPro: ""
    });
    setErrors({});
    onCancel();
  };

  const handleStateChange = (state: string) => {
    setFormData(prev => ({ ...prev, state }));
  };

  const handleCityChange = (city: string) => {
    setFormData(prev => ({ ...prev, city }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingClient ? "Editar Cliente" : "Novo Cliente"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name" className="flex items-center gap-1 font-semibold">
              Nome Completo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) {
                  setErrors(prev => ({ ...prev, name: "" }));
                }
              }}
              placeholder="Ex: João da Silva"
              className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 inline" /> {errors.name}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="cpf">CPF (Opcional)</Label>
            <IMaskInput
              mask="000.000.000-00"
              id="cpf"
              value={formData.cpf}
              onAccept={(value) => setFormData({ ...formData, cpf: value as string })}
              placeholder="000.000.000-00"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div>
            <Label htmlFor="phone">Telefone / WhatsApp (Opcional)</Label>
            <IMaskInput
              mask="(00) 00000-0000"
              id="phone"
              value={formData.phone}
              onAccept={(value) => setFormData({ ...formData, phone: value as string })}
              placeholder="(00) 00000-0000"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div>
            <Label htmlFor="email">E-mail (Opcional)</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="cliente@exemplo.com"
            />
          </div>

          <div>
            <Label htmlFor="birthDate">Data de Nascimento (Opcional)</Label>
            <Input
              id="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="cadPro">CAD/PRO (Opcional)</Label>
            <Input
              id="cadPro"
              value={formData.cadPro}
              onChange={(e) => setFormData({ ...formData, cadPro: e.target.value })}
              placeholder="Inscrição Estadual ou CAD/PRO"
            />
          </div>

          <div>
            <Label htmlFor="zipCode">CEP (Opcional)</Label>
            <IMaskInput
              mask="00000-000"
              id="zipCode"
              value={formData.zipCode}
              onAccept={(value) => setFormData({ ...formData, zipCode: value as string })}
              placeholder="00000-000"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <CityStateSelect
            state={formData.state}
            city={formData.city}
            onStateChange={handleStateChange}
            onCityChange={handleCityChange}
          />

          <div className="md:col-span-2 flex gap-2 pt-2">
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              {editingClient ? "Atualizar Cliente" : "Cadastrar Cliente"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
`;

const target = 'c:/Users/User/Documents/Projects/farm-flow-frontend/src/components/pages/customers/CustomersForm.tsx';
fs.writeFileSync(target, code, 'utf8');
console.log('Successfully updated CustomersForm.tsx with only name required and translated strings!');
