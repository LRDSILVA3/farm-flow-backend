-- ==============================================================================
-- LIMPEZA SEGURA DE DADOS OPERACIONAIS - FARM FLOW
-- ==============================================================================
-- Este script limpa todos os dados operacionais e de teste, mantendo 100% intactas
-- as tabelas essenciais: Usuários, Cargos, Permissões, Variáveis de Custo,
-- Catálogo de Serviços, Catálogo de Produtos, Equipamentos e Colaboradores.
-- ==============================================================================

BEGIN;

TRUNCATE TABLE 
  "service_executions",
  "sample_label_batches",
  "analyses",
  "sales_products",
  "sales",
  "financial_transactions",
  "stock_movements",
  "orders",
  "plots",
  "farms",
  "clients",
  "audit_logs"
CASCADE;

COMMIT;

-- ==============================================================================
-- TABELAS PRESERVADAS INTACTAS:
--  ✓ users
--  ✓ tb_user_position
--  ✓ tb_person
--  ✓ cost_variables
--  ✓ services
--  ✓ service_groups
--  ✓ products
--  ✓ service_products
--  ✓ equipment
--  ✓ collaborators
-- ==============================================================================
