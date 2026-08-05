import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_PATH) throw new Error('DATABASE_PATH is not set');

const client = new Database(env.DATABASE_PATH, { create: true });
// WAL lets readers run while the writer holds the lock — the right default
// for a server process talking to a local file.
client.exec('PRAGMA journal_mode = WAL;');
client.exec('PRAGMA foreign_keys = ON;');

export const db = drizzle(client, { schema });
