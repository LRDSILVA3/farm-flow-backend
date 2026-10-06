const fs = require('fs');
const path = require('path');

// 1. Criar PdfHeaderTab.tsx
const pdfHeaderTabPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/settings/PdfHeaderTab.tsx');
const pdfHeaderTabContent = `
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Printer, Save, RotateCcw, Building2, CheckCircle2 } from "lucide-react";

export interface PdfHeaderConfig {
  companyName: string;
  tagline: string;
  cnpj: string;
  phone: string;
  website: string;
  email: string;
  address: string;
  cityState: string;
  cep: string;
  versionCode: string;
  footerNotes: string;
  logoUrl?: string;
}

export const DEFAULT_PDF_HEADER: PdfHeaderConfig = {
  companyName: "PRECIZA",
  tagline: "AGRICULTURA DE PRECISÃO",
  cnpj: "06.697.836.0001/73",
  phone: "(45) 3242-2210",
  website: "www.preciza.com.br",
  email: "contato@preciza.com.br",
  address: "RUA HORTENCIA, 112, SALA 02",
  cityState: "CORBÉLIA - PARANÁ",
  cep: "85.420-000",
  versionCode: "Versão: 45791",
  footerNotes: "Orçamento válido por 15 dias. Condições comerciais sujeitas a alteração sem aviso prévio.",
  logoUrl: ""
};

export const STORAGE_KEY_PDF_HEADER = "farm_flow_pdf_header_config";

export const getStoredPdfHeaderConfig = (): PdfHeaderConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PDF_HEADER);
    if (raw) {
      return { ...DEFAULT_PDF_HEADER, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error("Erro ao carregar cabeçalho de PDF:", e);
  }
  return DEFAULT_PDF_HEADER;
};

export const PdfHeaderTab: React.FC = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<PdfHeaderConfig>(DEFAULT_PDF_HEADER);

  useEffect(() => {
    setConfig(getStoredPdfHeaderConfig());
  }, []);

  const handleChange = (field: keyof PdfHeaderConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(STORAGE_KEY_PDF_HEADER, JSON.stringify(config));
      toast({
        title: "Cabeçalho salvo com sucesso!",
        description: "Os novos dados já serão aplicados em todos os pedidos e relatórios gerados em PDF."
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_PDF_HEADER);
    localStorage.setItem(STORAGE_KEY_PDF_HEADER, JSON.stringify(DEFAULT_PDF_HEADER));
    toast({
      title: "Configurações restauradas",
      description: "Restaurado para os valores padrão de fábrica."
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Printer className="h-5 w-5 text-emerald-600" />
            Personalização do Cabeçalho dos PDFs e Documentos
          </h2>
          <p className="text-sm text-muted-foreground">
            Defina as informações institucionais exibidas no topo e rodapé das folhas de orçamento e relatórios.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1">
            <RotateCcw className="h-4 w-4" />
            Restaurar Padrão
          </Button>
          <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700 gap-1.5 shadow-sm">
            <Save className="h-4 w-4" />
            Salvar Cabeçalho
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FORMULÁRIO DE EDIÇÃO */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-600" />
              Dados da Empresa
            </CardTitle>
            <CardDescription>
              Essas informações serão gravadas no cabeçalho oficial de impressão.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="companyName">Nome da Empresa / Razão Social</Label>
                  <Input
                    id="companyName"
                    value={config.companyName}
                    onChange={(e) => handleChange("companyName", e.target.value)}
                    placeholder="Ex: PRECIZA"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tagline">Slogan / Subtítulo</Label>
                  <Input
                    id="tagline"
                    value={config.tagline}
                    onChange={(e) => handleChange("tagline", e.target.value)}
                    placeholder="Ex: AGRICULTURA DE PRECISÃO"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={config.cnpj}
                    onChange={(e) => handleChange("cnpj", e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone / WhatsApp</Label>
                  <Input
                    id="phone"
                    value={config.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="(45) 3242-2210"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={config.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                    placeholder="www.minhaempresa.com.br"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">E-mail de Contato</Label>
                <Input
                  id="email"
                  value={config.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="comercial@empresa.com.br"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Label htmlFor="address">Logradouro / Endereço</Label>
                  <Input
                    id="address"
                    value={config.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="RUA PRINCIPAL, 100"
                  />
                </div>
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={config.cep}
                    onChange={(e) => handleChange("cep", e.target.value)}
                    placeholder="85.000-000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cityState">Cidade - UF</Label>
                  <Input
                    id="cityState"
                    value={config.cityState}
                    onChange={(e) => handleChange("cityState", e.target.value)}
                    placeholder="Cascavel - Paraná"
                  />
                </div>
                <div>
                  <Label htmlFor="versionCode">Código de Versão / Identificador</Label>
                  <Input
                    id="versionCode"
                    value={config.versionCode}
                    onChange={(e) => handleChange("versionCode", e.target.value)}
                    placeholder="Versão: 2026.1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="logoUrl">URL do Logotipo (Opcional)</Label>
                <Input
                  id="logoUrl"
                  value={config.logoUrl || ""}
                  onChange={(e) => handleChange("logoUrl", e.target.value)}
                  placeholder="https://exemplo.com/logo.png"
                />
              </div>

              <div>
                <Label htmlFor="footerNotes">Notas de Rodapé Padrão dos Documentos</Label>
                <Textarea
                  id="footerNotes"
                  value={config.footerNotes}
                  onChange={(e) => handleChange("footerNotes", e.target.value)}
                  rows={2}
                  placeholder="Observações legais, validade da proposta comercial..."
                />
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Salvar Configurações
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* PRÉVIA EM TEMPO REAL DO CABEÇALHO IMPRESSO (LIVE PREVIEW) */}
        <Card className="bg-slate-50 border-slate-300">
          <CardHeader>
            <CardTitle className="text-base text-slate-800 flex items-center justify-between">
              <span>Pré-visualização do Cabeçalho Impresso</span>
              <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                A4 Folha Oficial
              </span>
            </CardTitle>
            <CardDescription>
              Representação exata de como os cabeçalhos sairão na impressora ou em PDF.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white border-2 border-black p-4 rounded-sm shadow-sm space-y-3 font-sans text-xs">
              <div className="text-center pb-2 border-b border-black">
                <div className="flex items-center justify-center gap-2 mb-1">
                  {config.logoUrl ? (
                    <img src={config.logoUrl} alt="Logo" className="h-10 max-w-[120px] object-contain inline-block" />
                  ) : (
                    <svg className="w-8 h-8 text-green-700 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <div className="text-left inline-block">
                    <h1 className="text-2xl font-black tracking-wider leading-none text-black">
                      {config.companyName || "NOME DA EMPRESA"}
                    </h1>
                    <p className="text-[10px] font-bold tracking-widest text-black">
                      {config.tagline || "AGRICULTURA DE PRECISÃO"}
                    </p>
                  </div>
                </div>

                <div className="text-[11px] font-semibold text-gray-800">
                  <span>{config.website || "www.empresa.com.br"}</span>
                  {config.phone && <span> &nbsp;•&nbsp; {config.phone}</span>}
                  {config.email && <span> &nbsp;•&nbsp; {config.email}</span>}
                </div>

                <div className="text-[10px] text-gray-700 mt-0.5">
                  {config.address} &nbsp;•&nbsp; {config.cityState} {config.cep && \`• CEP: \${config.cep}\`}
                </div>

                <div className="flex justify-between items-center text-[10px] text-gray-700 mt-0.5 px-2">
                  <span>CNPJ: {config.cnpj || "00.000.000/0001-00"}</span>
                  <span>FONE: {config.phone}</span>
                  <span>{config.versionCode}</span>
                </div>
              </div>

              {/* BARRA EXEMPLO */}
              <div className="flex justify-between items-center bg-gray-100 border border-black px-3 py-1 font-bold text-xs">
                <span className="text-red-700">PEDIDO DE SERVIÇO / VIA CLIENTE</span>
                <span>DATA: {new Date().toLocaleDateString('pt-BR')}</span>
              </div>

              {/* CORPO DE AMOSTRA */}
              <div className="p-3 border border-dashed border-gray-300 rounded text-center text-gray-400 text-xs py-6">
                [Tabela de Itens e Discriminativo Orçamentário da Propriedade]
              </div>

              {/* RODAPÉ EXEMPLO */}
              {config.footerNotes && (
                <div className="pt-2 border-t text-[10px] text-gray-500 italic">
                  {config.footerNotes}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
`;

fs.writeFileSync(pdfHeaderTabPath, pdfHeaderTabContent.trim(), 'utf8');
console.log('✅ PdfHeaderTab.tsx created successfully!');

// 2. Atualizar SettingsPage.tsx
const settingsPagePath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/SettingsPage.tsx');
let settingsContent = fs.readFileSync(settingsPagePath, 'utf8');

if (!settingsContent.includes('PdfHeaderTab')) {
  settingsContent = `import { PdfHeaderTab } from "./settings/PdfHeaderTab";\nimport { Printer } from "lucide-react";\n` + settingsContent;
  
  // Adicionar o item no menuSections
  settingsContent = settingsContent.replace(
    `description: "Banners e planos do aplicativo"\n    }`,
    `description: "Banners e planos do aplicativo"\n    },\n    {\n      id: "pdf-header",\n      title: "Cabeçalho dos PDFs",\n      icon: Printer,\n      description: "Personalizar dados da empresa nos documentos impressos"\n    }`
  );

  // Adicionar o renderActiveSection
  settingsContent = settingsContent.replace(
    `case "app":\n        return <AppSection />;`,
    `case "app":\n        return <AppSection />;\n      case "pdf-header":\n        return <PdfHeaderTab />;`
  );

  fs.writeFileSync(settingsPagePath, settingsContent, 'utf8');
  console.log('✅ SettingsPage.tsx updated with PdfHeaderTab menu!');
} else {
  console.log('SettingsPage already includes PdfHeaderTab');
}
