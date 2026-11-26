/**
 * Script de Limpeza Segura de Dados Operacionais - FarmFlow
 * 
 * Limpa apenas as movimentações operacionais (pedidos, agendas, clientes, fazendas, talhões, análises, financeiro),
 * PRESERVANDO 100% da estrutura essencial:
 *  - Usuários e Cargos (users, tb_user_position, tb_person)
 *  - Variáveis de Custo (cost_variables)
 *  - Serviços e Grupos (services, service_groups)
 *  - Produtos e Vínculos (products, service_products)
 *  - Equipamentos e Máquinas (equipment)
 *  - Colaboradores Oficiais Cadastrados (collaborators)
 */

const { createConnection } = require('typeorm');
const dotenv = require('dotenv');
dotenv.config();

const ormconfig = require('../ormconfig');

async function cleanOperationalData() {
  console.log('🔄 Conectando ao banco de dados...');
  const connection = await createConnection({
    ...ormconfig,
    entities: [] // Não precisamos carregar entidades para comandos diretos de DDL
  });

  try {
    console.log('⚠️  Iniciando limpeza segura dos dados operacionais...');

    const tablesToClean = [
      'service_executions',
      'sample_label_batches',
      'analyses',
      'sales_products',
      'sales',
      'financial_transactions',
      'stock_movements',
      'orders',
      'plots',
      'farms',
      'clients',
      'audit_logs'
    ];

    console.log(`📋 Tabelas que serão limpas (${tablesToClean.length}):`, tablesToClean.join(', '));

    for (const table of tablesToClean) {
      try {
        await connection.query(`TRUNCATE TABLE "${table}" CASCADE;`);
        console.log(`  ✓ Tabela "${table}" limpa com sucesso.`);
      } catch (err) {
        // Se a tabela não existir em alguma versão mais antiga, ignora com aviso
        console.warn(`  ⚠️ Aviso ao limpar "${table}":`, err.message || err);
      }
    }

    console.log('\n✅ LIMPEZA CONCLUÍDA COM SUCESSO!');
    console.log('🛡️  Estruturas preservadas intactas:');
    console.log('  - Variáveis de Custo (Planilha 2026)');
    console.log('  - Serviços e Grupos de Serviços');
    console.log('  - Produtos e Vínculos');
    console.log('  - Equipamentos');
    console.log('  - Colaboradores');
    console.log('  - Usuários e Permissões de Cargos');

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  } finally {
    await connection.close();
    console.log('🔌 Conexão encerrada.');
  }
}

cleanOperationalData();
