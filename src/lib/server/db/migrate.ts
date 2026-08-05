/**
 * Runtime migrator. Applies the committed SQL migrations in ./drizzle using
 * drizzle-orm only — drizzle-kit is NOT needed in production. Runs on every
 * deploy via docker-entrypoint.sh, and locally via `bun run db:migrate`.
 * Requires the bun runtime — it uses the built-in bun:sqlite driver.
 */
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';

const path = process.env.DATABASE_PATH;
if (!path) throw new Error('DATABASE_PATH is not set');

const client = new Database(path, { create: true });
client.exec('PRAGMA journal_mode = WAL;');
const db = drizzle(client);

migrate(db, { migrationsFolder: './drizzle' });
console.log(`✓ migrations applied to ${path}`);
client.close();
