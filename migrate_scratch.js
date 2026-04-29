const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  console.log('Connecting to DB...');
  await client.connect();
  console.log('Connected to DB');
  try {
    console.log('Running query...');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_delete boolean DEFAULT false');
    console.log('Query finished');
    console.log('Migration successful');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
    console.log('Connection closed');
  }
}

run().catch(console.error);
