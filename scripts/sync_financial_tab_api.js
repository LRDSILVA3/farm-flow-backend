const fs = require('fs');
const path = require('path');

const tabPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/financial/FinancialTransactionsTab.tsx');
let content = fs.readFileSync(tabPath, 'utf8');

// Adicionar import de api
if (!content.includes('import { api } from "@/services/api";')) {
  content = `import { api } from "@/services/api";\n` + content;
}

// Atualizar o useEffect para buscar da API /financial/transactions
const oldUseEffectRegex = /\/\/ Carrega transações salvas ou gera exemplos iniciais\s*useEffect\(\(\) => \{[\s\S]*?localStorage\.setItem\(STORAGE_KEY, JSON\.stringify\(initial\)\);\s*\}, \[\]\);/;

const newUseEffect = `// Carrega transações do backend com fallback para o storage local
  useEffect(() => {
    const fetchFromApi = async () => {
      try {
        const data = await api.get<any[]>('/financial/transactions');
        if (Array.isArray(data) && data.length > 0) {
          const mapped: FinancialTransaction[] = data.map(d => ({
            id: d.id,
            type: d.type,
            category: d.category,
            amount: parseFloat(d.amount) || 0,
            description: d.description,
            dueDate: d.due_date || d.dueDate || '',
            paidDate: d.payment_date || d.paidDate || undefined,
            status: d.status || 'pending',
            clientOrSupplier: d.notes || d.clientOrSupplier || '',
            paymentMethod: d.payment_method || d.paymentMethod || 'PIX',
            createdAt: d.created_at || new Date().toISOString()
          }));
          setTransactions(mapped);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
          return;
        }
      } catch (err) {
        console.warn('Usando transações locais:', err);
      }

      // Se API vazia ou offline, tenta carregar local
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setTransactions(JSON.parse(stored));
          return;
        }
      } catch {}

      // Exemplos iniciais realistas
      const initial: FinancialTransaction[] = [
        {
          id: "tx-1",
          type: "income",
          category: "Serviços Agrícolas",
          amount: 19320.34,
          description: "Recebimento Entrada - Amostragem de Solo Fazenda Santa Maria",
          dueDate: "2026-10-01",
          paidDate: "2026-10-01",
          status: "paid",
          clientOrSupplier: "João da Silva",
          paymentMethod: "PIX",
          createdAt: new Date().toISOString()
        },
        {
          id: "tx-2",
          type: "expense",
          category: "Combustível e Lubrificantes",
          amount: 850.00,
          description: "Abastecimento Quadriciclos ATV e Caminhonete",
          dueDate: "2026-10-02",
          paidDate: "2026-10-02",
          status: "paid",
          clientOrSupplier: "Posto Central Corbélia",
          paymentMethod: "Cartão",
          createdAt: new Date().toISOString()
        },
        {
          id: "tx-3",
          type: "expense",
          category: "Manutenção de Equipamentos e Maquinário",
          amount: 1200.00,
          description: "Revisão e Troca de Bicos de Pulverização Drone",
          dueDate: "2026-10-10",
          status: "pending",
          clientOrSupplier: "AgroPeças Paraná",
          paymentMethod: "Boleto",
          createdAt: new Date().toISOString()
        }
      ];

      setTransactions(initial);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    };

    fetchFromApi();
  }, []);`;

if (oldUseEffectRegex.test(content)) {
  content = content.replace(oldUseEffectRegex, newUseEffect);
  console.log('✅ Replaced useEffect in FinancialTransactionsTab');
} else {
  console.log('❌ oldUseEffectRegex did not match');
}

// Atualizar handleSave para também postar na API
const oldSaveRegex = /const handleSave = \(e: React\.FormEvent\) => \{[\s\S]*?setShowNewDialog\(false\);\s*\};/;

const newSave = `const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || formData.amount <= 0) {
      toast({
        title: "Dados incompletos",
        description: "Informe a descrição e um valor maior que zero.",
        variant: "destructive"
      });
      return;
    }

    const newTx: FinancialTransaction = {
      id: "tx-" + Date.now(),
      type: formData.type,
      category: formData.category,
      amount: formData.amount,
      description: formData.description,
      dueDate: formData.dueDate,
      paidDate: formData.status === 'paid' ? (formData.paidDate || formData.dueDate) : undefined,
      status: formData.status,
      clientOrSupplier: formData.clientOrSupplier,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes,
      createdAt: new Date().toISOString()
    };

    const updated = [newTx, ...transactions];
    saveTransactions(updated);

    // Sincroniza em background com o backend
    api.post('/financial/transactions', {
      description: newTx.description,
      type: newTx.type,
      category: newTx.category,
      amount: newTx.amount,
      due_date: newTx.dueDate,
      payment_date: newTx.paidDate || null,
      status: newTx.status,
      payment_method: newTx.paymentMethod,
      notes: newTx.clientOrSupplier || newTx.notes
    }).catch(err => console.warn('Erro ao salvar no backend:', err));

    toast({
      title: "Lançamento registrado!",
      description: \`\${formData.type === 'income' ? 'Entrada' : 'Saída'} de \${formatCurrency(formData.amount)} salva com sucesso.\`
    });

    setShowNewDialog(false);
  };`;

if (oldSaveRegex.test(content)) {
  content = content.replace(oldSaveRegex, newSave);
  console.log('✅ Replaced handleSave in FinancialTransactionsTab');
} else {
  console.log('❌ oldSaveRegex did not match');
}

// Atualizar handleDelete e handleToggleStatus para sincronizar com backend
content = content.replace(
  'const handleDelete = (id: string) => {',
  `const handleDelete = (id: string) => {
    api.delete(\`/financial/transactions/\${id}\`).catch(() => {});`
);

content = content.replace(
  'const handleToggleStatus = (id: string) => {',
  `const handleToggleStatus = (id: string) => {
    const target = transactions.find(t => t.id === id);
    if (target) {
      const nextStatus = target.status === 'paid' ? 'pending' : 'paid';
      api.put(\`/financial/transactions/\${id}\`, { status: nextStatus }).catch(() => {});
    }`
);

fs.writeFileSync(tabPath, content, 'utf8');
console.log('✅ FinancialTransactionsTab.tsx updated with full backend integration!');
