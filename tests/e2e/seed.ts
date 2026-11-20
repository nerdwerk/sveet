// Migrates and seeds a throwaway database for one e2e test. Never open local.db.
import { applyMigrations, openDatabase } from '../../src/lib/server/db/client.ts';
import { seed } from '../../src/lib/server/db/seed.ts';

const path = process.argv[2];
if (!path) throw new Error('A temporary database path is required');
const { client, db } = openDatabase(path);
try {
	applyMigrations(db);
	await seed(db);
} finally {
	client.close();
}
