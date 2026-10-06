const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres' });

async function run() {
  try {
    const q1 = await pool.query(`
      INSERT INTO cost_variables (id, code, name, value, unit, description)
      VALUES (gen_random_uuid(), 'VALOR_KM_DESLOCAMENTO_PRANCHA', 'Valor Km Deslocamento Caminhao Prancha', 10.0, 'R$/km', 'Valor por km de deslocamento do caminhão prancha (BANCO DE DADOS B28)')
      ON CONFLICT (code) DO UPDATE SET value = 10.0
      RETURNING *;
    `);
    console.log('Updated:', q1.rows[0].code);

    const q2 = await pool.query(`
      INSERT INTO cost_variables (id, code, name, value, unit, description)
      VALUES (gen_random_uuid(), 'VALOR_KM_DESLOCAMENTO_VAZIO', 'Valor Km Deslocamento Caminhao Vazio', 6.12, 'R$/km', 'Valor por km de deslocamento do caminhão vazio (BANCO DE DADOS B22)')
      ON CONFLICT (code) DO UPDATE SET value = 6.12
      RETURNING *;
    `);
    console.log('Updated:', q2.rows[0].code);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
