import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import * as schema from './schema.ts';

/**
 * Opens a SQLite file (or `:memory:`) with the pragmas every connection here
 * wants. Shared by the app, the CLIs and the tests, so they can't drift apart.
 * No SvelteKit imports — CLIs run this under plain `bun`.
 */
export function openDatabase(path: string) {
	const client = new Database(path, { create: true });
	// WAL lets readers run while the writer holds the lock — the right default
	// for a server process talking to a local file.
	if (path !== ':memory:') client.exec('PRAGMA journal_mode = WAL;');
	client.exec('PRAGMA foreign_keys = ON;');
	client.exec('PRAGMA busy_timeout = 5000;');
	return { client, db: drizzle(client, { schema }) };
}

export type Db = ReturnType<typeof openDatabase>['db'];

/** Applies the committed SQL in `drizzle/`. Idempotent; drizzle-kit isn't involved. */
export function applyMigrations(db: Db, migrationsFolder = './drizzle') {
	migrate(db, { migrationsFolder });
}
