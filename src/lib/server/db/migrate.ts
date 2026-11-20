/**
 * `bun run db:migrate` — applies the committed migrations to DATABASE_PATH.
 * The production server does the same on start (see `init` in hooks.server.ts),
 * so there is no separate "migrate prod" step.
 */
import { applyMigrations, openDatabase } from './client.ts';

const path = process.env.DATABASE_PATH;
if (!path) throw new Error('DATABASE_PATH is not set');

const { client, db } = openDatabase(path);
applyMigrations(db);
console.log(`✓ migrations applied to ${path}`);
client.close();
