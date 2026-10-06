const fs = require('fs');
const path = require('path');

const reportsPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/ReportsPage.tsx');
let content = fs.readFileSync(reportsPath, 'utf8');

// Adicionar busca de /orders/executions/all no Promise.all do loadData
content = content.replace(
  `const [ordersRes, collabsRes, equipRes, clientsRes, farmsRes] = await Promise.all([
        api.get<any[]>('/orders').catch(() => []),
        api.get<any[]>('/collaborators').catch(() => []),
        api.get<any[]>('/equipment').catch(() => []),
        api.get<any[]>('/clients').catch(() => []),
        api.get<any[]>('/farms').catch(() => []),
      ]);`,
  `const [ordersRes, collabsRes, equipRes, clientsRes, farmsRes, apiExecutionsRes] = await Promise.all([
        api.get<any[]>('/orders').catch(() => []),
        api.get<any[]>('/collaborators').catch(() => []),
        api.get<any[]>('/equipment').catch(() => []),
        api.get<any[]>('/clients').catch(() => []),
        api.get<any[]>('/farms').catch(() => []),
        api.get<any[]>('/orders/executions/all').catch(() => []),
      ]);

      if (Array.isArray(apiExecutionsRes) && apiExecutionsRes.length > 0) {
        setApiExecutions(apiExecutionsRes);
      }`
);

// Adicionar estado apiExecutions
content = content.replace(
  'const [farms, setFarms] = useState<any[]>([]);',
  'const [farms, setFarms] = useState<any[]>([]);\n  const [apiExecutions, setApiExecutions] = useState<any[]>([]);'
);

// No cálculo de savedSplits, mesclar apiExecutions
content = content.replace(
  `const savedSplits = useMemo(() => {
    try {
      const raw = localStorage.getItem("farm_flow_execution_splits");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);`,
  `const savedSplits = useMemo(() => {
    const list: any[] = [];
    if (apiExecutions && apiExecutions.length > 0) {
      apiExecutions.forEach(e => {
        list.push({
          operator: e.operator_name,
          equipment: e.equipment_name,
          areaHa: e.area_ha,
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
  }, [apiExecutions]);`
);

fs.writeFileSync(reportsPath, content, 'utf8');
console.log('✅ ReportsPage.tsx updated to query /orders/executions/all from backend PostgreSQL!');
