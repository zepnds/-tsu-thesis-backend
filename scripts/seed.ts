import { exec } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL is not set in .env');
  process.exit(1);
}

// Path to the dump file
const dumpPath = path.resolve(__dirname, '../database.dump');

// Use docker to run pg_restore so it doesn't require local Postgres installation
const command = `docker run --rm -v "${dumpPath}:/tmp/database.dump" postgres pg_restore -d "${dbUrl}" --clean --no-acl --no-owner /tmp/database.dump`;

console.log(`Starting database restore from: ${dumpPath}`);
console.log(`Target Database URL: ${dbUrl.replace(/:[^:@]+@/, ':***@')}`); // Mask password

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error during database restore: ${error.message}`);
    if (stderr) console.error(`pg_restore stderr: ${stderr}`);
    process.exit(1);
  }

  if (stderr) {
    // pg_restore sometimes writes non-fatal warnings to stderr
    console.warn(`pg_restore warnings: ${stderr}`);
  }

  console.log('Database seeded/restored successfully!');
  if (stdout) console.log(stdout);
});
