import { openDatabase } from './client.ts';
import { seed, SEED_USERS } from './seed.ts';

const path = process.env.DATABASE_PATH;
if (!path) throw new Error('DATABASE_PATH is not set');

const { client, db } = openDatabase(path);
await seed(db);
client.close();

console.log(`✓ seeded ${path} — sign in at /login as:`);
for (const { email } of Object.values(SEED_USERS)) console.log(`  ${email}`);
