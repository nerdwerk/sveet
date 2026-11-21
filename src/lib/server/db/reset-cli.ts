/**
 * `bun run db:reset` (followed by `db:seed`) — empties DATABASE_PATH in place
 * and migrates it. The file itself survives, so a running dev server keeps its
 * connection and simply sees fresh data: no restart needed.
 */
import { applyMigrations, openDatabase } from './client.ts';

const path = process.env.DATABASE_PATH;
if (!path) throw new Error('DATABASE_PATH is not set');

const { client, db } = openDatabase(path);
const objects = client
	.query<{ type: string; name: string }, []>(
		"select type, name from sqlite_master where name not like 'sqlite_%' and type in ('table', 'view', 'trigger')"
	)
	.all();

client.exec('PRAGMA foreign_keys = OFF;');
client.transaction(() => {
	for (const { type, name } of objects)
		client.exec(`DROP ${type.toUpperCase()} IF EXISTS "${name}"`);
})();
client.exec('PRAGMA foreign_keys = ON;');

applyMigrations(db);
client.close();
console.log(`✓ ${path} emptied (${objects.length} objects) and migrated`);
