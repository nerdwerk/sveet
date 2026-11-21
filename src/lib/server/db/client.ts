// No SvelteKit imports: the CLIs and tests use this under plain bun.
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import * as schema from './schema.ts';

export function openDatabase(path: string) {
	const client = new Database(path, { create: true });
	if (path !== ':memory:') client.exec('PRAGMA journal_mode = WAL;');
	client.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
	return { client, db: drizzle(client, { schema }) };
}

export type Db = ReturnType<typeof openDatabase>['db'];

export const applyMigrations = (db: Db) => migrate(db, { migrationsFolder: './drizzle' });
