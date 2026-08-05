import { defineConfig } from 'drizzle-kit';

const path = process.env.DATABASE_PATH;
if (!path) throw new Error('DATABASE_PATH is not set');

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'sqlite',
	dbCredentials: { url: path },
	verbose: true,
	strict: true
});
