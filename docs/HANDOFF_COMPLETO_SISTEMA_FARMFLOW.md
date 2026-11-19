# 🌾 FarmFlow - Documento de Handoff Completo do Sistema
**Preciza Tecnologia Agrícola**  
*Data de Conclusão e Transição: 19 de Novembro de 2026*  
*Versão do Sistema: 2.5.0 (Produção Homologada)*

---

## 📌 1. Visão Geral Executiva

O **FarmFlow** é a plataforma completa de gestão agronômica, operacional e financeira desenvolvida sob medida para a **Preciza Tecnologia Agrícola**. O sistema substitui integralmente controles manuais em planilhas dispersas (`budget.xlsm`, controles em WhatsApp, recibos manuais) por uma solução corporativa unificada, segura e auditada.

### Pilares do Sistema:
1. **Engenharia de Orçamentos e Motores de Cálculo:** Fidelidade matemática de 100% com as fórmulas oficiais de Amostragem de Solo em Grade (AP), Compactação de Solo, Aplicação ATV (corretivos), Pulverização/Mapeamento com Drone e Análise Foliar.
2. **Gestão Operacional de Campo e Talhões:** Apontamento por talhões múltiplos, parcelamento de área, rastreamento de insumos aplicados por operador e envio fracionado de análises para laboratórios parceiros.
3. **Agenda Dinâmica Plurianual:** Múltiplas visitas agronômicas por pedido, segmentadas por talhão e ciclos de safras anuais (como contratos de 2 a 5 anos do Sistema Equaliza).
4. **Financeiro Integrado e Cobrança por Safras:** Cronograma financeiro de safras futuras, fluxo de caixa automático a cada quitação (PIX, Boleto, Carteira) e conciliação em tempo real.
5. **Governança, Auditoria e Documentação Oficial:** Registro automático de auditoria para cada alteração (quem, quando, o quê e valores anteriores/posteriores) e emissão de Folha de Pedido / Proposta em PDF com layout oficial da Preciza.

---

## 🚀 2. Escopo Entregue na Última Atualização (Reunião Técnica)

Todas as solicitações levantadas na reunião técnica e alinhamentos operacionais foram desenvolvidas, testadas e postas em produção:

### 2.1. Execuções Parciais com Marcação de Produto e Insumos
- **Problema anterior:** Não era possível especificar qual insumo agrícola havia sido aplicado em uma execução de área parcial.
- **Solução implementada:**
  - Inclusão dos campos de insumo no apontamento: `product_name` (Produto/Insumo), `quantity` (Quantidade aplicada) e `unit` (Unidade: kg, L, sc, ton).
  - Tabela `service_executions` no PostgreSQL atualizada para persistir insumos de cada execução.
  - Exibição detalhada no histórico de execuções do pedido e relatórios operacionais.

### 2.2. Lançamento Parcial de Análises de Solo
- **Problema anterior:** Se um serviço executasse apenas 20% da área e coletasse 3 de 10 amostras, o sistema não permitia o apontamento parcial de amostras.
- **Solução implementada:**
  - Campo `samples_executed` inserido no apontamento diário de campo.
  - Totalizadores na tabela de pedidos com progresso visual: `🧪 Análises: 3/10`, `🧪 Análises: 41/41`.
  - Integração com o módulo de Análises: envio de amostras fracionadas com etiquetas e lote de remessa para o laboratório conforme a coleta física for sendo executada.

### 2.3. Múltiplos Talhões por Pedido (`PlotSelect`)
- **Problema anterior:** Um pedido só permitia cadastrar um único talhão ou a fazenda inteira.
- **Solução implementada:**
  - Criação do componente interativo `PlotSelect.tsx` com seleção multi-chip dos talhões cadastrados na fazenda e suporte a inserção rápida de novos talhões.
  - Persistência estruturada na coluna `plots` (JSONB) da tabela `orders`.
  - Badges visuais na listagem de pedidos (`📍 Talhão Norte 01, Talhão Sul 02, Talhão Leste 03`).
  - Impressão dos múltiplos talhões na Folha de Pedido / Proposta Oficial em PDF.

### 2.4. Rateio ATV por Operador e Produto (Splits de Aplicação)
- **Problema anterior:** Em aplicações com quadriciclos ATV operando em equipe, não havia como discriminar quanto cada colaborador aplicou de cada produto.
- **Solução implementada:**
  - Interface de divisão dinâmica (*splits*) no modal `OrderExecutionDialog.tsx`.
  - Permite adicionar múltiplos operadores com seus respectivos produtos e quantidades aplicadas.
  - Totalizadores dinâmicos garantindo que a soma dos rateios corresponda ao volume total apontado.
  - Persistência em coluna JSONB `splits` em `service_executions`.

### 2.5. Agenda de Serviços com Múltiplas Visitas e Vínculo por Talhão
- **Problema anterior:** Um pedido só permitia um único agendamento global.
- **Solução implementada:**
  - O modal `OrderScheduleDialog.tsx` permite agendar diversas visitas operacionais no mesmo contrato.
  - Cada agendamento pode ser vinculado a um talhão específico do pedido.
  - Suporte a contratos multianuais (Equaliza): possibilidade de agendar visitas para o Ano 1 (Safra 2025/2026), Ano 2 (Safra 2026/2027), etc.
  - Coluna de Agenda exibe o contador de visitas e safras programadas (`📅 X visitas programadas`).

### 2.6. Cronograma de Pagamentos Agendados por Safra (Contratos Equaliza e Plurianuais)
- **Problema anterior:** Contratos de 2 a 5 anos precisavam de um cronograma de pagamentos futuro dividido por safras anuais.
- **Solução implementada:**
  - Adição da coluna `payment_schedules` (JSONB) na tabela `orders` do PostgreSQL.
  - Reestruturação do modal `OrderPaymentDialog.tsx` em duas abas:
    1. **Aba 1: "Cronograma de Safras / Parcelas":**
       - **Gerador Rápido:** Divide automaticamente o valor total em 2 a 5 safras anuais com cálculo de centavos e sugestão de safras (`✨ Gerar 3 Safras`).
       - **Quitação Individual ("Dar Baixa"):** Permite quitar uma safra específica (ex: Safra 1 paga via PIX), alterando o status para `Pago`, recalculando o saldo restante e criando automaticamente o lançamento no Financeiro (`/financial/transactions`).
       - **Inclusão Avulsa:** Permite criar parcelas com vencimentos sazonais personalizados.
    2. **Aba 2: "Recebimento Avulso & Histórico":** Para entradas imediatas e consulta a todos os recebimentos já consolidados.
  - Badges na Tabela de Pedidos e Contas a Receber: `🌾 1/3 safras` (mostrando safras quitadas vs total contratado).

### 2.7. Folha de Pedido / Proposta Comercial em PDF
- **Melhorias implementadas:**
  - Mapeamento e exibição dos **múltiplos talhões** contratados na seção de Área/Fazenda.
  - Quadro automático **"CRONOGRAMA DE SAFRAS / PARCELAS PROGRAMADAS"** impresso quando o pedido possuir parcelamento plurianual, exibindo safra, vencimento, valor e status de pagamento.

---

## 🏗️ 3. Arquitetura Técnica e Infraestrutura

### 3.1. Topologia da Infraestrutura
O sistema está implantado no servidor dedicado no ambiente local da Preciza:

| Componente | Especificação | Porta / Acesso |
|---|---|:---:|
| **Servidor Físico** | HP Mini PC / Linux (Ubuntu Server) | `192.168.1.24` |
| **Rede Wi-Fi Homologada** | `Escritorio` (Banda 5 GHz / WPA2) | Gateway `192.168.1.1` |
| **Frontend SPA** | React 18, Vite, TailwindCSS, Radix UI, Nginx Alpine | `http://192.168.1.24:3000` |
| **Backend API** | Node.js 20, TypeScript, Express, TypeORM | `http://192.168.1.24:3333` |
| **Banco de Dados** | PostgreSQL 15 Alpine (Container Docker Dedicado) | `192.168.1.24:5432` |
| **Painel de Containers** | Coolify / Dozzle | Portas `8000` / `9000` |

### 3.2. Repositórios Git
- **Frontend:** `https://github.com/LRDSILVA3/farm-flow-frontend.git` (Branch: `main`)
- **Backend:** `https://github.com/LRDSILVA3/farm-flow-backend.git` (Branch: `main`)

### 3.3. Banco de Dados - Principais Entidades e Estruturas
- **`orders`:**
  - `id`: UUID (Primary Key)
  - `order_number`: Código amigável do pedido
  - `client_id`, `farm_id`: Relações com clientes e fazendas
  - `service_group`, `service_name`: Categoria e nome do serviço
  - `area_ha`: Área total em hectares
  - `total_amount`: Valor global contratado
  - `paid_amount`: Total acumulado pago
  - `status`: Status operacional (`Pendente`, `Em Andamento`, `Concluído`, `Cancelado`)
  - `payment`: Status financeiro (`Pendente`, `Parcial`, `Pago`)
  - `plots`: `JSONB` - Array com os talhões contratados (nomes ou objetos com id/área)
  - `total_samples`: Quantidade total prevista de amostras laboratoriais
  - `executed_samples`: Quantidade de amostras já coletadas
  - `payment_schedules`: `JSONB` - Cronograma com as safras anuais e parcelas agendadas:
    ```json
    [
      {
        "id": "sch-1",
        "cycleYear": 1,
        "cycleLabel": "Ano 1 - Safra 2026/2027",
        "installmentNumber": 1,
        "totalInstallments": 3,
        "dueDate": "2026-10-15",
        "amount": 15000.00,
        "status": "Pago",
        "paidDate": "2026-11-18",
        "paidAmount": 15000.00,
        "paymentMethod": "pix"
      }
    ]
    ```
  - `payments`: `JSONB` - Histórico de liquidações financeiras consolidadas
  - `schedules`: `JSONB` - Lista de visitas agronômicas agendadas por talhão e safra
  - `products_data`: `JSONB` - Discriminação de insumos, pontos de análise e custos
- **`service_executions`:** Apontamentos diários de campo contendo operador, equipamento, área executada, produto, quantidade, unidade, talhão e `splits` de rateio.
- **`financial_transactions`:** Entradas e saídas de caixa categorizadas com vínculo ao pedido.
- **`audit_logs`:** Registro imutável de auditoria (`CREATE`, `UPDATE`, `DELETE`, `EXECUTION`, `PAYMENT`).

---

## 🛠️ 4. Guia Operacional de Manutenção e Comandos

### 4.1. Conexão SSH ao Servidor
Para acessar o servidor via terminal:
```bash
ssh lucas@192.168.1.24
```
*(Certifique-se de que a máquina cliente está conectada na rede **Escritorio**).*

### 4.2. Comandos de Atualização e Deploy
Para aplicar alterações futuras em produção:

**Atualizar Backend:**
```bash
cd /home/lucas/farm-flow-backend
git pull origin main
docker compose restart api
```

**Atualizar Frontend:**
```bash
cd /home/lucas/farm-flow-frontend
git pull origin main
docker compose build frontend
docker compose up -d frontend
```

**Verificar Status dos Containers:**
```bash
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
```

**Acompanhar Logs em Tempo Real:**
```bash
docker logs -f farmflow-backend
docker logs -f farmflow-frontend
```

---

## 🔐 5. Credenciais de Acesso ao Sistema

- **URL de Produção:** [http://192.168.1.24:3000](http://192.168.1.24:3000)
- **Usuário Administrador Padrão:** `admin@farmflow.com`
- **Senha:** `admin123`

*(Outros usuários e operadores podem ser administrados diretamente no menu **Configurações > Usuários e Permissões**).*

---

## 📈 6. Status de Qualidade e Homologação

- **Testes Unitários:** 100% de aprovação (motores de cálculo com 0,00% de divergência em relação ao Excel oficial).
- **Testes de Integração API & Banco:** Operações de CRUD, persistência JSONB e auditoria validadas via endpoints TypeORM/PostgreSQL.
- **Testes Visuais e E2E:** Navegação, abertura de modais, responsividade, máscaras numéricas BRL e exportação de PDF validadas visualmente em ambiente real.

---
*FarmFlow - Sistema Homologado e Entregue com Sucesso.*  
*Preciza Tecnologia Agrícola © 2026*
