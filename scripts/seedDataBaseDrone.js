const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres' });

async function run() {
  try {
    const res = await pool.query(`
      INSERT INTO cost_variables (id, code, name, value, unit, description)
      VALUES (gen_random_uuid(), 'DATA_BASE_CALCULO_JURO_DRONE', 'Data Base Calculo Juro Drone', 20230130, 'Data', 'Data base para cálculo de juro de voo de drone (conforme budget.xlsm PEDIDO DRONE M31 = 44956 = 30/01/2023)')
      ON CONFLICT (code) DO UPDATE SET value = 20230130
      RETURNING *;
    `);
    console.log('Cost variable updated:', res.rows[0]);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
