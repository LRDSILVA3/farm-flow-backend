const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres' });

async function run() {
  try {
    const res = await pool.query(`
      INSERT INTO cost_variables (id, code, name, value, unit, description)
      VALUES (gen_random_uuid(), 'JUROS_DRONE_PERCENTUAL', 'Juros Voo de Drone Percentual', 3.0, '%/mês', 'Taxa de juros mensal para cálculo de voo de drone mapeamento (conforme budget.xlsm PEDIDO DRONE M34)')
      ON CONFLICT (code) DO UPDATE SET value = 3.0
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
