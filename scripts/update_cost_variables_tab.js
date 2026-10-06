const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/settings/CostVariablesTab.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const helperFunction = `
const getImpactedServices = (variable: CostVariable): string[] => {
  if (variable.linkedServices && variable.linkedServices.length > 0) {
    return variable.linkedServices.map(s => s.name);
  }
  const code = (variable.code || '').toUpperCase();
  const name = (variable.name || '').toUpperCase();
  const category = (variable.category || '').toUpperCase();

  const services: string[] = [];

  if (code.includes('AP_') || code.includes('AMOSTRAGEM') || code.includes('TIER_') || code.includes('REANALISE') || category.includes('AP')) {
    services.push('Amostragem de Solo (AP)');
  }
  if (code.includes('CONFERENCIA') || code.includes('CONF_') || category.includes('CONFERÊNCIA') || category.includes('CONFERENCIA')) {
    services.push('Conferência');
  }
  if (code.includes('FOLIAR') || code.includes('FOLHA') || category.includes('FOLIAR')) {
    services.push('Coleta Foliar');
  }
  if (code.includes('COMPACTA') || category.includes('COMPACTA')) {
    services.push('Compactação de Solo');
  }
  if (code.includes('DRONE_MAP') || code.includes('VOO_DRONE') || category.includes('DRONE MAP')) {
    services.push('Voo de Drone (Mapeamento)');
  }
  if (code.includes('DRONE_PULVE') || code.includes('SPRAY') || category.includes('DRONE PULVE')) {
    services.push('Pulverização Drone');
  }
  if (code.includes('ATV') || code.includes('ESTERCO') || category.includes('ATV')) {
    services.push('Aplicação ATV');
  }
  if (code.includes('EQUALIZA') || category.includes('EQUALIZA')) {
    services.push('Equalização de Serviços');
  }
  if (code.includes('ANALISE') || code.includes('LAB') || code.includes('MACRO') || code.includes('FISICA') || code.includes('ENXOFRE') || code.includes('ADUBO') || category.includes('LABORATÓRIO') || category.includes('LABORATORIO')) {
    services.push('Análises Laboratoriais');
  }
  if (code.includes('DIESEL') || code.includes('COMBUSTIVEL') || code.includes('KM_') || code.includes('DIARIA') || code.includes('PA_CARREGADEIRA') || category.includes('COMBUSTÍVEL') || category.includes('LOGÍSTICA') || category.includes('EQUIPAMENTOS')) {
    services.push('Operações & Frota');
  }
  if (code.includes('JUROS') || code.includes('IMPOSTO') || code.includes('NF') || category.includes('FINANCEIRO') || category.includes('FISCAL')) {
    services.push('Precificação Financeira');
  }

  return services.length > 0 ? services : ['Geral / Custo Operacional'];
};
`;

if (!content.includes('getImpactedServices')) {
  content = content.replace('export const CostVariablesTab: React.FC<CostVariablesTabProps> = ({', helperFunction + '\nexport const CostVariablesTab: React.FC<CostVariablesTabProps> = ({');
}

// Substituição usando regex independente de CRLF
const cellRegex = /<TableCell>\s*<div className="flex flex-wrap gap-1">[\s\S]*?variable\.linkedServices[\s\S]*?<\/div>\s*<\/TableCell>/;

const replacementStr = `<TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[260px]">
                        {getImpactedServices(variable).map((serviceName, idx) => (
                          <Badge 
                            key={idx} 
                            variant="outline" 
                            className="text-[11px] font-medium bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 flex items-center py-0.5 px-2"
                          >
                            <Link className="h-3 w-3 mr-1 text-emerald-600 shrink-0" />
                            {serviceName}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>`;

if (cellRegex.test(content)) {
  content = content.replace(cellRegex, replacementStr);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ CostVariablesTab updated successfully with regex!');
} else {
  console.log('❌ cellRegex failed to match');
}
