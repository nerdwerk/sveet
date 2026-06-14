/**
 * First-run setup: create a local .env from .env.example with a freshly
 * generated BETTER_AUTH_SECRET. Safe to re-run — it never overwrites an
 * existing .env. After this, run `bun run db:migrate` to create local.db.
 */
import { existsSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

if (existsSync('.env')) {
	console.log('• .env already exists — leaving it untouched.');
} else {
	copyFileSync('.env.example', '.env');
	const secret = randomBytes(32).toString('base64');
	const env = readFileSync('.env', 'utf8').replace(
		/^BETTER_AUTH_SECRET=.*$/m,
		`BETTER_AUTH_SECRET="${secret}"`
	);
	writeFileSync('.env', env);
	console.log('✓ created .env with a generated BETTER_AUTH_SECRET');
}
console.log('→ next: bun run db:migrate && bun run dev');
