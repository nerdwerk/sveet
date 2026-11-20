/**
 * `bun run db:seed` — applies the dev seed to DATABASE_PATH. `db:reset` runs
 * it after migrating, so a reset always leaves you with a usable app.
 */
import { openDatabase } from './client.ts';
import { seed } from './seed.ts';

const path = process.env.DATABASE_PATH;
if (!path) throw new Error('DATABASE_PATH is not set');
const origin = process.env.ORIGIN ?? 'http://localhost:5173';

const { client, db } = openDatabase(path);
const summary = await seed(db);
client.close();

console.log(`\n✓ seeded ${path}\n`);
console.log(`Users — sign in at ${origin}/login; the magic link prints to the dev server log:`);
for (const person of summary.users) console.log(`  ${person.email.padEnd(20)} ${person.name}`);
console.log(`Notes: ${summary.notes}\n`);
