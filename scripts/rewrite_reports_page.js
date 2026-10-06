const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/ReportsPage.tsx');

const content = `import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Users,
  Truck,
  TrendingUp,
  MapPin,
  Printer,
  FileSpreadsheet
} from "lucide-react";
import { api } from "@/services/api";

export const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [apiExecutions, setApiExecutions] = useState<any[]>([]);

  // Filtros
  const [periodFilter, setPeriodFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, collabsRes, equipRes, clientsRes, farmsRes, apiExecutionsRes] = await Promise.all([
        api.get<any[]>('/orders').catch(() => []),
        api.get<any[]>('/collaborators').catch(() => []),
        api.get<any[]>('/equipment').catch(() => []),
        api.get<any[]>('/clients').catch(() => []),
        api.get<any[]>('/farms').catch(() => []),
        api.get<any[]>('/orders/executions/all').catch(() => []),
      ]);

      setOrders(Array.isArray(ordersRes) ? ordersRes : []);
      setCollaborators(Array.isArray(collabsRes) ? collabsRes : []);
      setEquipmentList(Array.isArray(equipRes) ? equipRes : []);
      setClients(Array.isArray(clientsRes) ? clientsRes : []);
      setFarms(Array.isArray(farmsRes) ? farmsRes : []);
      if (Array.isArray(apiExecutionsRes) && apiExecutionsRes.length > 0) {
        setApiExecutions(apiExecutionsRes);
      }
    } catch (e) {
      console.error("Erro ao carregar dados do relatório:", e);
    } finally {
      setLoading(false);
    }
  };

  const savedSplits = useMemo(() => {
    const list: any[] = [];
    if (apiExecutions && apiExecutions.length > 0) {
      apiExecutions.forEach(e => {
        list.push({
          operator: e.operator_name,
          equipment: e.equipment_name,
          areaHa: parseFloat(e.area_ha) || 0,
          notes: e.notes
        });
      });
    }
    try {
      const raw = localStorage.getItem("farm_flow_execution_splits");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list.push(...parsed);
      }
    } catch {}
    return list;
  }, [apiExecutions]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const serviceName = o.serviceName || o.service_name || o.type || "";
      if (serviceFilter !== "all" && !serviceName.toLowerCase().includes(serviceFilter.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [orders, serviceFilter]);

  const kpiData = useMemo(() => {
    let totalArea = 0;
    let totalValue = 0;
    let completedOrders = 0;

    filteredOrders.forEach(o => {
      const area = parseFloat(o.area) || 0;
      const val = parseFloat(o.numericValue || o.value) || 0;
      totalArea += area;
      totalValue += val;
      if (o.status === "Concluído" || o.status === "Finalizado") {
        completedOrders++;
      }
    });

    return {
      totalOrders: filteredOrders.length,
      completedOrders,
      totalArea,
      totalValue,
      totalAlqueires: totalArea / 2.42
    };
  }, [filteredOrders]);

  const collaboratorProductivity = useMemo(() => {
    const map = new Map<string, { name: string; totalHa: number; ordersCount: number; services: Set<string> }>();

    collaborators.forEach(c => {
      map.set(c.name, { name: c.name, totalHa: 0, ordersCount: 0, services: new Set() });
    });

    savedSplits.forEach((split: any) => {
      const name = split.operator || "Não informado";
      const ha = parseFloat(split.areaHa) || 0;
      if (!map.has(name)) {
        map.set(name, { name, totalHa: 0, ordersCount: 0, services: new Set() });
      }
      const item = map.get(name)!;
      item.totalHa += ha;
      item.ordersCount += 1;
      if (split.serviceName) item.services.add(split.serviceName);
    });

    filteredOrders.forEach(o => {
      if (o.collaborator && map.has(o.collaborator)) {
        const item = map.get(o.collaborator)!;
        if (item.totalHa === 0) {
          item.totalHa += (parseFloat(o.area) || 0);
          item.ordersCount += 1;
        }
      }
    });

    return Array.from(map.values())
      .filter((v, idx, arr) => arr.findIndex(x => x.name === v.name) === idx)
      .sort((a, b) => b.totalHa - a.totalHa);
  }, [collaborators, savedSplits, filteredOrders]);

  const equipmentUsage = useMemo(() => {
    const map = new Map<string, { name: string; type: string; totalHa: number; usesCount: number; plate?: string }>();

    equipmentList.forEach(e => {
      map.set(e.name, {
        name: e.name,
        type: e.type || "Equipamento",
        totalHa: 0,
        usesCount: 0,
        plate: e.plate
      });
    });

    savedSplits.forEach((split: any) => {
      const name = split.equipment || "Geral";
      const ha = parseFloat(split.areaHa) || 0;
      if (!map.has(name)) {
        map.set(name, { name, type: "Geral", totalHa: 0, usesCount: 0 });
      }
      const item = map.get(name)!;
      item.totalHa += ha;
      item.usesCount += 1;
    });

    return Array.from(map.values()).sort((a, b) => b.totalHa - a.totalHa);
  }, [equipmentList, savedSplits]);

  const serviceBreakdown = useMemo(() => {
    const map = new Map<string, { serviceName: string; totalOrders: number; totalArea: number; totalValue: number }>();

    filteredOrders.forEach(o => {
      const sName = o.serviceName || o.service_name || o.type || "Outro Serviço";
      const area = parseFloat(o.area) || 0;
      const val = parseFloat(o.numericValue || o.value) || 0;

      if (!map.has(sName)) {
        map.set(sName, { serviceName: sName, totalOrders: 0, totalArea: 0, totalValue: 0 });
      }
      const item = map.get(sName)!;
      item.totalOrders += 1;
      item.totalArea += area;
      item.totalValue += val;
    });

    return Array.from(map.values()).sort((a, b) => b.totalValue - a.totalValue);
  }, [filteredOrders]);

  const regionalBreakdown = useMemo(() => {
    const map = new Map<string, { cityState: string; totalFarms: number; totalArea: number; totalValue: number }>();

    farms.forEach(f => {
      const key = \`\${f.city || 'Não informada'} / \${f.state || 'PR'}\`;
      const area = parseFloat(f.area) || 0;
      if (!map.has(key)) {
        map.set(key, { cityState: key, totalFarms: 0, totalArea: 0, totalValue: 0 });
      }
      const item = map.get(key)!;
      item.totalFarms += 1;
      item.totalArea += area;
    });

    return Array.from(map.values()).sort((a, b) => b.totalArea - a.totalArea);
  }, [farms]);

  const handleExportCsv = (type: 'collaborators' | 'equipment' | 'services' | 'regional') => {
    let filename = 'relatorio_farm_flow';
    let headers: string[] = [];
    let rows: string[][] = [];

    if (type === 'collaborators') {
      filename = \`produtividade_equipe_\${new Date().toISOString().split('T')[0]}.csv\`;
      headers = ['Colaborador', 'Hectares Executados', 'Alqueires', 'Qtd Execucoes', 'Participacao Percentual'];
      rows = collaboratorProductivity.map(c => [
        \`"\${c.name}"\`,
        c.totalHa.toFixed(2).replace('.', ','),
        (c.totalHa / 2.42).toFixed(2).replace('.', ','),
        c.ordersCount.toString(),
        \`"\${kpiData.totalArea > 0 ? ((c.totalHa / kpiData.totalArea) * 100).toFixed(1) : '0'}%"\`
      ]);
    } else if (type === 'equipment') {
      filename = \`uso_equipamentos_\${new Date().toISOString().split('T')[0]}.csv\`;
      headers = ['Equipamento', 'Tipo', 'Identificacao Placa', 'Hectares Operados', 'Qtd Atendimentos'];
      rows = equipmentUsage.map(e => [
        \`"\${e.name}"\`,
        \`"\${e.type}"\`,
        \`"\${e.plate || '-'}"\`,
        e.totalHa.toFixed(2).replace('.', ','),
        e.usesCount.toString()
      ]);
    } else if (type === 'services') {
      filename = \`volume_servicos_\${new Date().toISOString().split('T')[0]}.csv\`;
      headers = ['Servico', 'Qtd Ordens', 'Area Total Hectares', 'Area Alqueires', 'Faturamento Total R$', 'Ticket Medio R$/ha'];
      rows = serviceBreakdown.map(s => [
        \`"\${s.serviceName}"\`,
        s.totalOrders.toString(),
        s.totalArea.toFixed(2).replace('.', ','),
        (s.totalArea / 2.42).toFixed(2).replace('.', ','),
        s.totalValue.toFixed(2).replace('.', ','),
        (s.totalArea > 0 ? (s.totalValue / s.totalArea) : 0).toFixed(2).replace('.', ',')
      ]);
    } else {
      filename = \`distribuicao_regional_\${new Date().toISOString().split('T')[0]}.csv\`;
      headers = ['Municipio e UF', 'Fazendas Atendidas', 'Area Total Hectares', 'Area Alqueires'];
      rows = regionalBreakdown.map(r => [
        \`"\${r.cityState}"\`,
        r.totalFarms.toString(),
        r.totalArea.toFixed(2).replace('.', ','),
        (r.totalArea / 2.42).toFixed(2).replace('.', ',')
      ]);
    }

    const csvContent = '\\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\\r\\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-emerald-600" />
            Relatórios Operacionais & Auditoria de Campo
          </h2>
          <p className="text-sm text-muted-foreground">
            Acompanhamento de produtividade por operador, uso de maquinário, volumes executados e faturamento.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExportCsv('services')} className="gap-1.5 shadow-sm">
            <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
            Exportar Excel / CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 shadow-sm">
            <Printer className="h-4 w-4" />
            Imprimir Relatório
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-xs font-semibold text-muted-foreground block mb-1">Filtrar por Serviço:</span>
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger><SelectValue placeholder="Todos os serviços" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Serviços</SelectItem>
                  <SelectItem value="Amostragem">Amostragem de Solo (AP)</SelectItem>
                  <SelectItem value="Conferência">Conferência de Amostragem</SelectItem>
                  <SelectItem value="Drone">Voo / Pulverização Drone</SelectItem>
                  <SelectItem value="Foliar">Coleta Foliar</SelectItem>
                  <SelectItem value="Compactação">Compactação de Solo</SelectItem>
                  <SelectItem value="ATV">Aplicação ATV</SelectItem>
                  <SelectItem value="Equaliza">Sistema Equaliza</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <span className="text-xs font-semibold text-muted-foreground block mb-1">Período de Análise:</span>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger><SelectValue placeholder="Todo o histórico" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Histórico Completo</SelectItem>
                  <SelectItem value="month">Mês Atual</SelectItem>
                  <SelectItem value="quarter">Último Trimestre</SelectItem>
                  <SelectItem value="year">Safra Atual (2026)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setServiceFilter("all"); setPeriodFilter("all"); }}
                className="text-xs text-muted-foreground"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-emerald-50/50 border-emerald-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-emerald-800">
              Área Total Coberta
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-950">
              {kpiData.totalArea.toFixed(2)} ha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-emerald-700 font-medium">
              Equivalente a {kpiData.totalAlqueires.toFixed(2)} alqueires
            </span>
          </CardContent>
        </Card>

        <Card className="bg-blue-50/50 border-blue-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-blue-800">
              Faturamento Contratado
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-950">
              {formatCurrency(kpiData.totalValue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-blue-700 font-medium">
              Em {kpiData.totalOrders} ordens de serviço
            </span>
          </CardContent>
        </Card>

        <Card className="bg-purple-50/50 border-purple-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-purple-800">
              Serviços Concluídos
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-purple-950">
              {kpiData.completedOrders} / {kpiData.totalOrders}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-purple-700 font-medium">
              {kpiData.totalOrders > 0 ? ((kpiData.completedOrders / kpiData.totalOrders) * 100).toFixed(1) : 0}% de taxa de entrega
            </span>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 border-amber-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium text-amber-800">
              Equipe Ativa em Campo
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-950">
              {collaborators.length} operadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-amber-700 font-medium">
              {equipmentList.length} máquinas e veículos
            </span>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="collaborators" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
          <TabsTrigger value="collaborators" className="gap-1.5 text-xs">
            <Users className="h-4 w-4" />
            Produtividade da Equipe
          </TabsTrigger>
          <TabsTrigger value="equipment" className="gap-1.5 text-xs">
            <Truck className="h-4 w-4" />
            Uso de Equipamentos
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-1.5 text-xs">
            <TrendingUp className="h-4 w-4" />
            Volume por Serviço
          </TabsTrigger>
          <TabsTrigger value="regional" className="gap-1.5 text-xs">
            <MapPin className="h-4 w-4" />
            Distribuição Regional
          </TabsTrigger>
        </TabsList>

        <TabsContent value="collaborators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Desempenho e Hectares Executados por Operador</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Baseado nas execuções de campo da Agenda
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador / Operador</TableHead>
                    <TableHead>Área Executada (ha)</TableHead>
                    <TableHead>Área em Alqueires</TableHead>
                    <TableHead>Serviços Atendidos</TableHead>
                    <TableHead className="text-right">Participação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collaboratorProductivity.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        Nenhum colaborador registrado com execuções no período.
                      </TableCell>
                    </TableRow>
                  ) : (
                    collaboratorProductivity.map((collab, idx) => {
                      const percent = kpiData.totalArea > 0 ? ((collab.totalHa / kpiData.totalArea) * 100).toFixed(1) : "0.0";
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-semibold text-emerald-950 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            {collab.name}
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-sm">{collab.totalHa.toFixed(2)} ha</span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {(collab.totalHa / 2.42).toFixed(2)} alq
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {collab.ordersCount} execução(ões)
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-mono text-xs font-semibold bg-muted px-2 py-1 rounded">
                              {percent}%
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Horímetro e Hectares Operados por Equipamento / Veículo</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Rastreabilidade da frota e maquinário de precisão
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Identificação / Placa</TableHead>
                    <TableHead>Hectares Operados</TableHead>
                    <TableHead className="text-right">Atendimentos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipmentUsage.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        Nenhum equipamento registrado com execuções no período.
                      </TableCell>
                    </TableRow>
                  ) : (
                    equipmentUsage.map((eq, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{eq.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-normal">
                            {eq.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {eq.plate ? (
                            <code className="text-xs font-mono font-bold bg-muted px-1.5 py-0.5 rounded">
                              {eq.plate}
                            </code>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-bold text-sm">
                          {eq.totalHa.toFixed(2)} ha
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-xs bg-muted px-2 py-1 rounded font-semibold">
                            {eq.usesCount} vez(es)
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Volume Executado e Faturamento por Serviço</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço Oficial</TableHead>
                    <TableHead>Qtd Ordens</TableHead>
                    <TableHead>Área Total (ha)</TableHead>
                    <TableHead>Área em Alqueires</TableHead>
                    <TableHead>Faturamento Total</TableHead>
                    <TableHead className="text-right">Ticket Médio/ha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceBreakdown.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                        Nenhum serviço registrado no período.
                      </TableCell>
                    </TableRow>
                  ) : (
                    serviceBreakdown.map((s, idx) => {
                      const avgPerHa = s.totalArea > 0 ? (s.totalValue / s.totalArea) : 0;
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-semibold text-emerald-950">
                            {s.serviceName}
                          </TableCell>
                          <TableCell>{s.totalOrders}</TableCell>
                          <TableCell className="font-bold">{s.totalArea.toFixed(2)} ha</TableCell>
                          <TableCell className="text-muted-foreground">
                            {(s.totalArea / 2.42).toFixed(2)} alq
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {formatCurrency(s.totalValue)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {formatCurrency(avgPerHa)}/ha
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribuição Territorial das Fazendas e Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Município / UF</TableHead>
                    <TableHead>Fazendas Atendidas</TableHead>
                    <TableHead>Área Cadastrada (ha)</TableHead>
                    <TableHead className="text-right">Área em Alqueires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regionalBreakdown.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                        Nenhuma fazenda cadastrada com dados de localização.
                      </TableCell>
                    </TableRow>
                  ) : (
                    regionalBreakdown.map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                          {r.cityState}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {r.totalFarms} propriedade(s)
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">{r.totalArea.toFixed(2)} ha</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {(r.totalArea / 2.42).toFixed(2)} alq
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
`;

fs.writeFileSync(targetPath, content.trim(), 'utf8');
console.log('✅ ReportsPage.tsx rewritten cleanly from scratch!');
