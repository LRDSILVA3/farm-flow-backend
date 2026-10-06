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
  const res = await pool.query(`
    SELECT column_name, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'cpf';
  `);
  console.log('CPF column info:', res.rows);

  // If not nullable, alter table
  if (res.rows.length && res.rows[0].is_nullable === 'NO') {
    await pool.query(`ALTER TABLE clients ALTER COLUMN cpf DROP NOT NULL;`);
    console.log('Successfully dropped NOT NULL constraint on clients.cpf');
  } else {
    console.log('CPF is already nullable or does not exist');
  }

  await pool.end();
}

run().catch(console.error);
