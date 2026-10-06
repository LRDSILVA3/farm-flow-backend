const fs = require('fs');
const path = require('path');

const reportsPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/ReportsPage.tsx');
let content = fs.readFileSync(reportsPath, 'utf8');

// Trecho correto completo da função
const cleanCode = `  const handleExportCsv = (type: 'collaborators' | 'equipment' | 'services' | 'regional') => {
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
  };`;

// Substituir desde const handleExportCsv até window.print(); };
const cutRegex = /const handleExportCsv = \([\s\S]*?window\.print\(\);\s*\};/;
content = content.replace(cutRegex, cleanCode);

fs.writeFileSync(reportsPath, content, 'utf8');
console.log('✅ ReportsPage.tsx fixed cleanly!');
