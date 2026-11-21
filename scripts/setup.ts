// First run: .env with a fresh secret (never overwritten), then a seeded local DB.
import { existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { $ } from 'bun';

if (!existsSync('.env')) {
	const example = await Bun.file('.env.example').text();
	const secret = randomBytes(32).toString('base64');
	await Bun.write(
		'.env',
		example.replace(/^BETTER_AUTH_SECRET=.*$/m, `BETTER_AUTH_SECRET="${secret}"`)
	);
	console.log('✓ created .env');
}
await $`bun run db:reset`;
