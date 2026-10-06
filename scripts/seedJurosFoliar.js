const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres' });

async function run() {
  try {
    const res = await pool.query(`
      INSERT INTO cost_variables (id, code, name, value, unit, description)
      VALUES (gen_random_uuid(), 'JUROS_FOLIAR_PERCENTUAL', 'Juros Coleta Foliar Percentual', 3.0, '%/mês', 'Taxa de juros mensal para cálculo de coleta foliar (conforme budget.xlsm INPUT FOLHA F2)')
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
