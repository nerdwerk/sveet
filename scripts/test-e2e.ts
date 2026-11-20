/**
 * `bun run test:e2e` — builds the production server, then runs Playwright
 * against it. Extra arguments go to Playwright (`bun run test:e2e auth`).
 * Install the browser once with `bun run test:setup`.
 */
const env = {
	...process.env,
	// The build evaluates server modules; keep it away from local.db.
	DATABASE_PATH: ':memory:',
	ORIGIN: 'http://127.0.0.1:4173',
	BETTER_AUTH_SECRET: 'e2e-build-only-secret-never-used-in-production'
};

const run = (cmd: string[]) => Bun.spawn(cmd, { env, stdout: 'inherit', stderr: 'inherit' }).exited;

let status = await run(['bun', 'run', 'build']);
if (status === 0)
	status = await run(['bunx', '--no-install', 'playwright', 'test', ...process.argv.slice(2)]);
process.exit(status);
