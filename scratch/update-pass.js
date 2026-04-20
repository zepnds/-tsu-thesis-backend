const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:vr123456@localhost:5432/cemetery_db'
  });
  await client.connect();
  const hash = await bcrypt.hash('vr123456', 10);
  await client.query('UPDATE users SET password_hash = $1 WHERE username = $2', [hash, 'admin']);
  console.log('Updated admin password to vr123456');
  await client.end();
}
run();
