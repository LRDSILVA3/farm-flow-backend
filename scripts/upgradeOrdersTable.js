const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres'
});

async function run() {
  await client.connect();

  await client.query(`
    ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS executions jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS schedules jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS payments jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS executed_area numeric(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS paid_amount numeric(12,2) DEFAULT 0;
  `);
  console.log('Columns added or already exist in orders table.');

  // Fix values with 1932034.00 or similar
  await client.query(`
    UPDATE orders 
    SET value = 19320.34, status = 'Pendente', payment = 'Aguardando' 
    WHERE id = 'aeba6cf2-ae2d-4713-be2f-3c40c961061c';
  `);
  console.log('Fixed order aeba6cf2-ae2d-4713-be2f-3c40c961061c.');

  // Also translate any other orders with english status
  await client.query(`
    UPDATE orders SET status = 'Pendente' WHERE status IN ('Pending', 'pending');
    UPDATE orders SET status = 'Aprovado' WHERE status IN ('Approved', 'approved');
    UPDATE orders SET status = 'Em Andamento' WHERE status IN ('In Progress', 'in_progress');
    UPDATE orders SET status = 'Concluído' WHERE status IN ('Completed', 'completed');
    UPDATE orders SET status = 'Cancelado' WHERE status IN ('Cancelled', 'cancelled', 'Canceled');

    UPDATE orders SET payment = 'Aguardando' WHERE payment IN ('Awaiting', 'awaiting', 'Pending');
    UPDATE orders SET payment = 'Parcial' WHERE payment IN ('Partial', 'partial');
    UPDATE orders SET payment = 'Pago' WHERE payment IN ('Paid', 'paid');
  `);
  console.log('Translated status and payment in orders table.');

  await client.end();
}

run().catch(console.error);
