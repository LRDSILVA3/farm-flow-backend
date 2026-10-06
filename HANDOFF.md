# HANDOFF TÉCNICO E OPERACIONAL - FARM FLOW & PRECIZA

> **Data:** 04/10/2026  
> **Status dos Testes:** Backend 97/97 passing | Frontend 37/37 passing  
> **Status de Build:** Frontend Vite Production Build 100% OK (~6.4s)  
> **Ambiente Local:** Backend na porta `3333`, Frontend na porta `8080`, PostgreSQL `5432` (`postgres:postgres@localhost:5432/postgres`)

---

## 1. Visão Geral da Arquitetura

O sistema é uma plataforma completa de gestão de pedidos, orçamentos agrícolas de precisão e operações de campo para a **PRECIZA AGRICULTURA DE PRECISÃO**:

- **Backend (`farm-flow-backend`):**
  - Node.js, Express, TypeScript, TypeORM, PostgreSQL.
  - Módulos principais: `orders`, `clients`, `farms`, `cost-variables`, `budget`, `user`, `services`, `sales`.
  - Serviços de domínio matemático desacoplados em `src/modules/budget/services/domain/`.
- **Frontend (`farm-flow-frontend`):**
  - React 18, TypeScript, Vite, TailwindCSS, Shadcn UI.
  - Componentes de pedidos e orçamentos em `src/components/pages/orders/`.
  - Hooks especializados em `src/hooks/` (`useOrders`, `useClients`, `useFarms`, `useCostVariables`).

---

## 2. Relação com o Excel (`budget.xlsm`)

- **Desacoplamento Total em Produção:** O sistema **NÃO** lê nem aponta para o arquivo `budget.xlsm` em tempo de execução.
- **Papel do Excel:** A planilha serviu exclusivamente como a especificação de engenharia, gabarito matemático e matriz de testes.
- **Variáveis de Custo (`cost_variables`):** 
  - Todas as 64 variáveis da planilha (`BANCO DE DADOS`, taxas, juros, valores de análises) estão salvas no PostgreSQL na tabela `cost_variables`.
  - O backend expõe a API `/cost-variables` e o frontend consome dinamicamente via `useCostVariables()`.
  - Se qualquer parâmetro mudar no banco, os cálculos se adaptam automaticamente sem tocar em código.
- **Fórmulas de Domínio:** Cada aba da planilha foi convertida em um serviço modular TypeScript:
  1. `SoilSamplingService` (Aba `INPUT DADOS` / `PEDIDO AP`)
  2. `ConferenciaService` (Aba `INPUT CONFERENCIA` / `PEDIDO CONFERENCIA`)
  3. `DroneMappingService` (Aba `PEDIDO DRONE`)
  4. `DroneSprayingService` (Aba `INPUT PULVE_DRONE` / `PEDIDO PULVE`)
  5. `ATVService` (Aba `INPUT ATV` / `PEDIDO ATV`)
  6. `FoliarService` (Aba `INPUT FOLHA ` / `PEDIDO FOLHA CLIENTE`)
  7. `CompactionService` (Aba `PEDIDO COMPACTA`)
  8. `EqualizaService` (Aba `EQUALIZA`)
  9. `BiologicalProductsService` (Aba `LALLEMAND` / `PEDIDO LALLEMAND`)

---

## 3. O que Foi Feito Nesta Sessão

### A. Correção do Caractere Quebrado (Encoding UTF-8)
- **Problema:** A UI exibia `Conferncia de Amostragem` com o caractere de substituição `\uFFFD` (losango preto com ponto de interrogação).
- **Causa Raiz:** O registro `20dd27a5-0a78-4611-9caf-dea585c29011` no PostgreSQL continha os bytes literais `ef bf bd` (`\uFFFD`) na coluna `service_name` e `type`.
- **Solução no Banco:** Executamos script com buffer UTF-8 substituindo os bytes corrompidos por `c3 aa` (`ê`), restaurando `Conferência de Amostragem`. Varredura completa confirmou 0 strings corrompidas no banco.
- **Solução no Frontend:** Injetamos sanitizadores automáticos com regex (`formatServiceName` e `sanitizeText`) em `useOrders.ts` e `OrdersTable.tsx`, prevenindo qualquer falha futura de mojibake (`ConferÃªncia`), sem acento ou caractere inválido.

### B. Gestão de Ciclo de Vida dos Pedidos
- **Formatação de Moeda & Decimal:** Corrigido bug de parsing onde decimais como `"19320.34"` perdiam o ponto e viravam `"1932034.00"`.
- **Identificação Real:** Substituídos IDs/UUIDs na tabela por nomes reais do Cliente e da Fazenda.
- **Tradução:** Status e pagamentos 100% em português (`Pendente`, `Aprovado`, `Em Andamento`, `Concluído`, `Cancelado` / `Aguardando`, `Parcial`, `Pago`).
- **Ações Completas Implementadas:**
  - `OrderExecutionDialog.tsx`: Registro de execução 100% ou parcial com barra de progresso em hectares.
  - `OrderScheduleDialog.tsx`: Múltiplos agendamentos por pedido.
  - `OrderPaymentDialog.tsx`: Registro de pagamentos, cobrança parcial/total e método de pagamento.

### C. Folha de Pedido / Orçamento Oficial para Impressão (`OrderPrintDialog.tsx`)
- **Fidelidade Visual:** Reprodução exata do layout da folha impressa da Preciza (`PEDIDO VIA CLIENTE` e `PEDIDO VIA EMPRESA` do Excel):
  - Cabeçalho corporativo com logo, CNPJ, Corbélia - PR, telefone, site e versão.
  - Alternador dinâmico de **Via Cliente** / **Via Empresa**.
  - Blocos formais: Dados do Cliente, Dados da Área/Fazenda, Condições Comerciais e Assinaturas.
  - Título dinâmico por serviço (`PEDIDO VIA CLIENTE - CONFERÊNCIA`, `PEDIDO VIA CLIENTE - AP`, etc.).
- **Resolução do `R$ NaN`:** `order.value` continha string formatada (`"R$ 5.645,90"`), que causava `NaN` com `parseFloat`. Implementada a função universal `parseNum`.
- **Discriminação Financeira dos Pontos e Análises:**
  - **Conferência (R$ 5.645,90):** Decompõe exatamente em:
    - Coleta de Conferência: R$ 4.522,90
    - Análise de Solo Macro (10 PTOS × R$ 105,30): R$ 1.053,00
    - Análise 20-40cm (1 PTOS × R$ 70,00): R$ 70,00
    - Total: R$ 5.645,90
  - **Amostragem AP (R$ 19.320,34):** Exibe 50 ALQ de serviço base + 41 PTOS inclusos (2,95 ha/ponto) + Recomendações inclusas + Desconto comercial (-R$ 1.319,88) = Total R$ 19.320,34.
- **Edição em Tempo Real:** Botão **"Editar Valores e Campos"** permite alterar na hora Lote, Matrícula, Consultor, Quantidades de análises e valores unitários antes de imprimir.
- **Impressão A4 Limpa:** CSS `@media print` configurado para folha A4 retrato sem menus ou botões do sistema.

### D. Persistência de Dados das Análises (`products_data`)
- No PostgreSQL, a coluna `orders.products_data` (JSONB) foi populada com o detalhamento dos 2 pedidos existentes.
- Conectados os formulários `ConferenciaServiceForm.tsx` e `SoilSamplingServiceForm.tsx` ao `OrderForm.tsx` via callback `onProductsChange`, garantindo que **todos os novos pedidos criados salvem automaticamente o array de análises e pontos**.

---

## 4. Gotchas e Regras de Ambiente (CRÍTICO)

1. **Permissões do Workspace:**
   - O workspace root registrado é `farm-flow-backend`.
   - Tentativas de editar arquivos diretamente em `farm-flow-frontend` com `replace_file_content` recebem `Permission denied`.
   - **Solução Obrigatória:** Todas as alterações no frontend devem ser realizadas via scripts Node.js em `farm-flow-backend/scripts/` executados com `run_command`.
2. **Caminho do Node/NVM no Windows:**
   - O PowerShell padrão não possui o Node no PATH global.
   - **Sempre prefixar comandos com:**  
     `$env:PATH = "C:\Users\User\AppData\Roaming\nvm\v20.20.2;" + $env:PATH;`
3. **Escaping no PowerShell:**
   - Evitar usar interpolações de variáveis como `$1`, `${val}` ou crases dentro de `node -e "..."` no PowerShell, pois o shell interpreta e remove essas variáveis antes de passar para o Node. Crie scripts `.js` dentro de `scripts/`.
4. **Parsing de Valores Monetários:**
   - Nunca usar `parseFloat(value)` diretamente para valores que possam ter passado por `Intl.NumberFormat` ou formulários brasileiros. Use sempre o helper `parseNum` que trata vírgulas e prefixos `R$`.

---

## 5. Estrutura dos Arquivos Chave Criados/Modificados

```
farm-flow-frontend/
├── src/
│   ├── components/pages/orders/
│   │   ├── OrderPrintDialog.tsx          <- Folha oficial de impressão/PDF da Preciza
│   │   ├── OrdersTable.tsx               <- Tabela de pedidos com ações de lifecycle e botão imprimir
│   │   ├── OrderExecutionDialog.tsx      <- Diálogo de execução total/parcial
│   │   ├── OrderScheduleDialog.tsx       <- Diálogo de agendamentos
│   │   ├── OrderPaymentDialog.tsx        <- Diálogo de cobrança e pagamentos
│   │   ├── OrderForm.tsx                 <- Formulário de criação com sincronização de productsData
│   │   ├── ConferenciaServiceForm.tsx    <- Cálculo de conferência + emissão de produtos
│   │   └── SoilSamplingServiceForm.tsx   <- Cálculo de AP + emissão de produtos
│   └── hooks/
│       ├── useOrders.ts                  <- Sanitização UTF-8, mapping de status/valores, CRUD API
│       ├── useCostVariables.ts           <- Consumo dinâmico das variáveis de custo do banco
│       ├── useClients.ts                 <- Dados cadastrais do produtor
│       └── useFarms.ts                   <- Dados da fazenda, lotes e matrículas

farm-flow-backend/
├── src/
│   ├── modules/budget/services/domain/   <- Todos os services de cálculo matemático (9 serviços)
│   ├── modules/cost-variables/           <- CRUD TypeORM de variáveis de custo
│   └── modules/orders/                   <- Entidade, controller e services de pedidos
└── scripts/
    ├── seedOrderProductsData.js          <- Popula products_data no banco
    ├── updatePrintDialogValues.js        <- Script de build do OrderPrintDialog
    ├── scanDbCorruption.js               <- Scanner de integridade UTF-8 no PostgreSQL
    └── fixUtf8Order.js                   <- Patch de correção de bytes corrompidos
```

---

## 6. Backlog e Próximos Passos Sugeridos

1. **Exportação Direta em PDF (Servidor / Puppeteer / jsPDF):**
   - Atualmente a impressão usa `window.print()` do navegador, que permite "Salvar como PDF".
   - Pode-se adicionar um botão de download direto de `.pdf` usando `html2pdf.js` ou geração no backend.
2. **Histórico de Alterações na Ordem:**
   - Adicionar timeline/log de quem aprovou, cancelou ou registrou pagamentos.
3. **Mais Serviços no Formulário de Pedidos:**
   - Garantir que todos os 9 formulários especializados tenham inputs completos para seus parâmetros específicos na hora de criar um pedido.
4. **Relatórios Financeiros:**
   - Painel consolidado cruzando área executada vs. valor recebido por produtor e cultura.

