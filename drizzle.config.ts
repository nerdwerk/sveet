import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

// libsql:// (or https://) means a hosted Turso database; file: means local.
const isRemote = url.startsWith('libsql://') || url.startsWith('https://');

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: isRemote ? 'turso' : 'sqlite',
	dbCredentials: { url, authToken: process.env.DATABASE_AUTH_TOKEN },
	verbose: true,
	strict: true
});
