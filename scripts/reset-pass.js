import { Client } from 'pg';
import bcrypt from 'bcryptjs';

async function main() {
  const client = new Client({ connectionString: 'postgresql://postgres:altora2026@127.0.0.1:5432/altora_market' });
  await client.connect();
  const hash = await bcrypt.hash('123456', 10);
  const res = await client.query('UPDATE "User" SET "passwordHash" = $1', [hash]);
  console.log('Updated rows:', res.rowCount);
  await client.end();
}

main().catch(console.error);
