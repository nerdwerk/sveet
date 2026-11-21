import { afterEach } from 'vitest';
import type { Database } from 'bun:sqlite';
import { applyMigrations, openDatabase } from './client.ts';

const clients = new Set<Database>();
afterEach(() => {
	for (const client of clients) client.close();
	clients.clear();
});

export function createTestDb() {
	const { client, db } = openDatabase(':memory:');
	clients.add(client);
	applyMigrations(db);
	return db;
}
