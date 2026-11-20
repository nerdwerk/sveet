import { afterEach } from 'vitest';
import type { Database } from 'bun:sqlite';
import { applyMigrations, openDatabase } from './client.ts';

const clients = new Set<Database>();
afterEach(() => {
	for (const client of clients) client.close();
	clients.clear();
});

/** A fresh, fully migrated in-memory database — one per call, for test isolation. */
export function createTestDb() {
	const { client, db } = openDatabase(':memory:');
	clients.add(client);
	applyMigrations(db);
	return db;
}
