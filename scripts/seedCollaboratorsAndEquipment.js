const { Client } = require('pg');

async function seed() {
  const client = new Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/postgres' });
  await client.connect();

  const existingCols = await client.query('SELECT count(*) FROM collaborators');
  if (parseInt(existingCols.rows[0].count) < 5) {
    console.log('Seeding more collaborators...');
    const collaborators = [
      { name: 'Carlos Eduardo', role: 'Piloto de Drone', phone: '(45) 99765-4321', email: 'carlos@preciza.com.br', status: 'Ativo' },
      { name: 'Rodrigo Almeida', role: 'Técnico Agrícola / Amostragem', phone: '(45) 99654-3210', email: 'rodrigo@preciza.com.br', status: 'Ativo' },
      { name: 'Ana Paula Silva', role: 'Engenheira Agrônoma', phone: '(45) 99543-2109', email: 'ana.paula@preciza.com.br', status: 'Ativo' },
      { name: 'Marcos Souza', role: 'Operador de Quadriciclo', phone: '(45) 99432-1098', email: 'marcos@preciza.com.br', status: 'Ativo' }
    ];

    for (const c of collaborators) {
      await client.query(
        'INSERT INTO collaborators (name, role, phone, email, status) VALUES ($1, $2, $3, $4, $5)',
        [c.name, c.role, c.phone, c.email, c.status]
      );
    }
  }

  const finalCols = await client.query('SELECT count(*) FROM collaborators');
  const finalEqs = await client.query('SELECT count(*) FROM equipment');
  console.log(`Ready! Collaborators: ${finalCols.rows[0].count}, Equipment: ${finalEqs.rows[0].count}`);

  await client.end();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
