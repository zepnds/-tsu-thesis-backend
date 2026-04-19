const { Client } = require('pg');
require('dotenv').config({ path: './.env' });

async function testDB() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    const res = await client.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cemetery_info');");
    console.log('Table cemetery_info exists:', res.rows[0].exists);

    if (res.rows[0].exists) {
      const countRes = await client.query("SELECT COUNT(*) FROM cemetery_info;");
      console.log('Row count:', countRes.rows[0].count);
    }
  } catch (err) {
    console.error('DB Error:', err.message);
  } finally {
    await client.end();
  }
}

testDB();
