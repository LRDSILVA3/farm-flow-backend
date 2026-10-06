const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'postgres'
});

async function run() {
  // 1. Order AP (19320.34)
  const apProducts = [
    {
      id: "analises_inclusas",
      name: "ANÁLISE INCLUSA (2,95 ha/ponto)",
      quantity: 41,
      unit: "PTOS",
      price: 0
    }
  ];
  await pool.query(
    'UPDATE orders SET products_data = $1 WHERE id = $2',
    [JSON.stringify(apProducts), 'aeba6cf2-ae2d-4713-be2f-3c40c961061c']
  );
  console.log('Order 1 (AP) updated with products_data (41 PTOS).');

  // 2. Order Conferência (5645.90)
  const confProducts = [
    {
      id: "analises_macro",
      name: "ANÁLISE DE SOLO (MACRO+S+P_REM)",
      quantity: 10,
      unit: "PTOS",
      price: 105.30
    },
    {
      id: "analises_20_40",
      name: "ANÁLISE DE SOLO 20-40 CM (MACRO+S)",
      quantity: 1,
      unit: "PTOS",
      price: 70.00
    },
    {
      id: "analise_fisica",
      name: "ANÁLISE FÍSICA",
      quantity: 1,
      unit: "UNID",
      price: 42.30
    }
  ];
  await pool.query(
    'UPDATE orders SET products_data = $1 WHERE id = $2',
    [JSON.stringify(confProducts), '20dd27a5-0a78-4611-9caf-dea585c29011']
  );
  console.log('Order 2 (Conferência) updated with products_data (10 PTOS).');

  const check = await pool.query('SELECT id, type, products_data FROM orders');
  console.log('Current DB state:', JSON.stringify(check.rows, null, 2));

  await pool.end();
}

run().catch(console.error);
