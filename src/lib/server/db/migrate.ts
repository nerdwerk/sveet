/**
 * Runtime migrator. Applies the committed SQL migrations in ./drizzle using
 * drizzle-orm only — drizzle-kit is NOT needed in production. Runs on every
 * deploy via docker-entrypoint.sh, and locally via `bun run db:migrate`.
 * Works against a local file or a hosted libSQL/Turso URL.
 */
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { migrate } from 'drizzle-orm/libsql/migrator';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const client = createClient({
	url,
	authToken: process.env.DATABASE_AUTH_TOKEN || undefined
});
const db = drizzle(client);

await migrate(db, { migrationsFolder: './drizzle' });
console.log(`✓ migrations applied to ${url}`);
client.close();
