const { DataSource } = require('typeorm');
const d = new DataSource({ type: 'postgres', url: 'postgresql://postgres:postgres@localhost:5432/sementeryo', synchronize: false });
d.initialize().then(() => d.query("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'burial_requests_status_check'")).then(console.log).catch(console.error).finally(()=>d.destroy());
