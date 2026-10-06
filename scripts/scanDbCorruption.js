const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'postgres'
});

async function scanAllTables() {
  const tablesRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  let found = 0;
  for (const row of tablesRes.rows) {
    const table = row.table_name;
    const colsRes = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1", [table]);
    const textCols = colsRes.rows.filter(c => ['text', 'character varying', 'character'].includes(c.data_type)).map(c => `"${c.column_name}"`);
    if (textCols.length === 0) continue;

    try {
      const dataRes = await pool.query(`SELECT ${textCols.join(', ')} FROM "${table}"`);
      for (const r of dataRes.rows) {
        for (const col of textCols) {
          const rawCol = col.replace(/"/g, '');
          const val = r[rawCol];
          if (typeof val === 'string') {
            for (let i = 0; i < val.length; i++) {
              const code = val.charCodeAt(i);
              if (code === 0xFFFD || code === 65533) {
                console.log(`Corrupted \\uFFFD in table: ${table}, column: ${rawCol}, val: ${val}`);
                found++;
                break;
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(`Error querying ${table}:`, err.message);
    }
  }
  console.log(`Scan completed. Found ${found} corrupted strings.`);
  await pool.end();
}

scanAllTables().catch(console.error);
