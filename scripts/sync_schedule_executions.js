const fs = require('fs');
const path = require('path');

const schedPath = path.resolve(__dirname, '../../farm-flow-frontend/src/components/pages/SchedulePage.tsx');
let content = fs.readFileSync(schedPath, 'utf8');

const targetSnippet = `toast({
        title: "Apontamento registrado!",
        description: \`Registrado \${areaNum.toFixed(2)} ha com sucesso. Total executado: \${totalExec.toFixed(2)} ha.\`
      });`;

const replacementSnippet = `// Persiste rateios de operadores e equipamentos no banco de dados
      if (executionSplits.length > 0) {
        Promise.all(executionSplits.map(s => 
          api.post(\`/orders/\${selectedExecution.id}/executions\`, {
            operator_name: s.collaboratorName,
            equipment_name: s.equipmentName,
            area_ha: s.areaHa,
            execution_date: partialExecutionForm.date,
            notes: partialExecutionForm.notes
          }).catch(err => console.warn('Erro ao salvar split no backend:', err))
        ));
      } else {
        api.post(\`/orders/\${selectedExecution.id}/executions\`, {
          operator_name: partialExecutionForm.collaborators[0] || 'Equipe Geral',
          equipment_name: partialExecutionForm.equipmentNames[0] || 'Geral',
          area_ha: areaNum,
          execution_date: partialExecutionForm.date,
          notes: partialExecutionForm.notes
        }).catch(err => console.warn('Erro ao salvar execução no backend:', err));
      }

      toast({
        title: "Apontamento registrado!",
        description: \`Registrado \${areaNum.toFixed(2)} ha com sucesso. Total executado: \${totalExec.toFixed(2)} ha.\`
      });`;

if (content.includes(targetSnippet)) {
  content = content.replace(targetSnippet, replacementSnippet);
  fs.writeFileSync(schedPath, content, 'utf8');
  console.log('✅ SchedulePage.tsx updated to post executions to PostgreSQL backend!');
} else {
  console.log('❌ targetSnippet not found in SchedulePage.tsx');
}
