/**
 * `bun run setup` — first run. Creates `.env` from `.env.example` with a fresh
 * BETTER_AUTH_SECRET, then migrates and seeds the local database. Safe to
 * re-run: an existing `.env` is never touched.
 */
import { existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { $ } from 'bun';

if (existsSync('.env')) {
	console.log('• .env already exists — leaving it untouched.');
} else {
	const secret = randomBytes(32).toString('base64');
	const example = await Bun.file('.env.example').text();
	await Bun.write(
		'.env',
		example.replace(/^BETTER_AUTH_SECRET=.*$/m, `BETTER_AUTH_SECRET="${secret}"`)
	);
	console.log('✓ created .env with a generated BETTER_AUTH_SECRET');
}

await $`bun run db:reset`;
console.log('→ next: bun run dev');
