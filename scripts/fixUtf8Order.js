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

  const res = await client.query("SELECT type, encode(type::bytea, 'hex') as hex, service_name FROM orders WHERE id = '20dd27a5-0a78-4611-9caf-dea585c29011'");
  console.log('Before update:', res.rows[0]);

  // Use Buffer with proper UTF-8 to be 100% sure:
  // 'Conferência' in UTF-8 hex: 43 6f 6e 66 65 72 c3 aa 6e 63 69 61
  const typeVal = Buffer.from('436f6e666572c3aa6e636961', 'hex').toString('utf8');
  const serviceVal = Buffer.from('436f6e666572c3aa6e63696120646520416d6f7374726167656d', 'hex').toString('utf8');

  await client.query("UPDATE orders SET type = $1, service_name = $2 WHERE id = $3", [
    typeVal,
    serviceVal,
    '20dd27a5-0a78-4611-9caf-dea585c29011'
  ]);

  const after = await client.query("SELECT type, encode(type::bytea, 'hex') as hex, service_name FROM orders WHERE id = '20dd27a5-0a78-4611-9caf-dea585c29011'");
  console.log('After update:', after.rows[0]);

  await client.end();
}

run().catch(console.error);
