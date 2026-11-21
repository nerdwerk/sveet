import { test as base, expect, type Page } from '@playwright/test';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

type App = {
	url: string;
	magicLink: (email: string) => Promise<string>;
};

async function freePort() {
	const server = createServer().listen(0, '127.0.0.1');
	await once(server, 'listening');
	const address = server.address();
	if (!address || typeof address === 'string') throw new Error('No test port allocated');
	await new Promise((done) => server.close(done));
	return address.port;
}

export const test = base.extend<{ app: App }>({
	// eslint-disable-next-line no-empty-pattern
	app: async ({}, use, testInfo) => {
		const directory = await mkdtemp(join(tmpdir(), 'sveet-e2e-'));
		const database = join(directory, 'test.db');
		const port = await freePort();
		const url = `http://127.0.0.1:${port}`;
		const env = {
			...process.env,
			DATABASE_PATH: database,
			ORIGIN: url,
			BETTER_AUTH_SECRET: 'e2e-only-secret-never-used-in-production',
			HOST: '127.0.0.1',
			PORT: String(port),
			MAIL_TRANSPORT: 'console'
		};

		let logs = '';
		let server: ReturnType<typeof spawn> | undefined;
		try {
			execFileSync('bun', ['tests/e2e/seed.ts', database], { env, stdio: 'pipe' });
			server = spawn(join(process.env.BUILD_DIR || 'build', 'server'), {
				env,
				stdio: ['ignore', 'pipe', 'pipe']
			});
			server.stdout!.on('data', (chunk) => (logs += chunk));
			server.stderr!.on('data', (chunk) => (logs += chunk));

			await expect
				.poll(
					async () => {
						if (server!.exitCode !== null) throw new Error(`Server exited:\n${logs}`);
						return fetch(url).then(
							(r) => r.status,
							() => 0
						);
					},
					{ timeout: 15_000, message: 'Built app starts against the seeded database' }
				)
				.toBe(200);

			await use({
				url,
				magicLink: async (email) => {
					const find = () =>
						[...logs.matchAll(/\[mail\] to=(\S+) [^\n]*\n[\s\S]*?(https?:\/\/\S+magic-link\S+)/g)]
							.filter((match) => match[1] === email)
							.at(-1)?.[2];
					await expect.poll(find, { message: `Magic link mailed to ${email}` }).toBeTruthy();
					return find()!;
				}
			});
		} finally {
			if (server?.exitCode === null) {
				server.kill('SIGTERM');
				await once(server, 'exit');
			}
			if (testInfo.status !== testInfo.expectedStatus) {
				await testInfo.attach('server.log', { body: logs, contentType: 'text/plain' });
			}
			await rm(directory, { recursive: true, force: true });
		}
	},
	baseURL: async ({ app }, use) => {
		await use(app.url);
	}
});

export { expect };

export async function signIn(page: Page, app: App, email: string) {
	await page.goto('/login');
	await page.getByLabel('Email').fill(email);
	await page.getByRole('button', { name: 'Email me a link' }).click();
	await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible();
	await page.goto(await app.magicLink(email));
	await expect(page).toHaveURL(/\/account$/);
}
