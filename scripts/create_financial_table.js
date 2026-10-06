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
    CREATE TABLE IF NOT EXISTS financial_transactions (
      id uuid NOT NULL DEFAULT uuid_generate_v4(),
      user_id character varying,
      order_id character varying,
      client_id character varying,
      description character varying NOT NULL,
      type character varying NOT NULL,
      category character varying NOT NULL,
      amount numeric(12,2) NOT NULL,
      due_date character varying,
      payment_date character varying,
      status character varying NOT NULL DEFAULT 'pending',
      payment_method character varying,
      notes text,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now(),
      CONSTRAINT PK_financial_transactions PRIMARY KEY (id)
    );
  `);
  console.log('✅ financial_transactions table created in PostgreSQL!');

  // Tabela para rateio de execuções de campo da agenda
  await client.query(`
    CREATE TABLE IF NOT EXISTS service_executions (
      id uuid NOT NULL DEFAULT uuid_generate_v4(),
      order_id character varying NOT NULL,
      operator_name character varying NOT NULL,
      equipment_name character varying,
      area_ha numeric(10,2) NOT NULL,
      execution_date character varying,
      notes text,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now(),
      CONSTRAINT PK_service_executions PRIMARY KEY (id)
    );
  `);
  console.log('✅ service_executions table created in PostgreSQL!');

  await client.end();
}

run().catch(console.error);
