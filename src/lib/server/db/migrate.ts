import { applyMigrations, openDatabase } from './client.ts';

const path = process.env.DATABASE_PATH;
if (!path) throw new Error('DATABASE_PATH is not set');

const { client, db } = openDatabase(path);
applyMigrations(db);
client.close();
console.log(`✓ migrations applied to ${path}`);
