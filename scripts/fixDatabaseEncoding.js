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

  // 1. Fix orders table
  await client.query(`
    UPDATE orders 
    SET 
      type = REPLACE(REPLACE(type, 'Conferncia', 'Conferência'), '', 'ê'),
      service_name = REPLACE(REPLACE(service_name, 'Conferncia', 'Conferência'), '', 'ê')
    WHERE type LIKE '%%' OR service_name LIKE '%%';
  `);

  await client.query(`
    UPDATE orders 
    SET service_name = type 
    WHERE service_name IS NULL OR service_name = '';
  `);

  // 2. Fix clients, farms, plots, services just in case
  const tablesAndCols = [
    { table: 'clients', cols: ['name', 'city', 'state'] },
    { table: 'farms', cols: ['name', 'city', 'state'] },
    { table: 'plots', cols: ['name', 'city', 'state'] },
    { table: 'services', cols: ['name'] },
    { table: 'service_groups', cols: ['name', 'description'] },
  ];

  for (const { table, cols } of tablesAndCols) {
    for (const col of cols) {
      await client.query(`
        UPDATE ${table} 
        SET ${col} = REPLACE(${col}, '', 'ê')
        WHERE ${col} LIKE '%%';
      `);
    }
  }

  // Verify orders
  const orders = await client.query('SELECT id, type, service_name FROM orders');
  console.log('Fixed Orders:', orders.rows);

  await client.end();
}

run().catch(console.error);
