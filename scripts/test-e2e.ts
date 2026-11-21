// Builds the production server, then runs Playwright against it; extra args go to Playwright.
const env = {
	...process.env,
	DATABASE_PATH: ':memory:',
	ORIGIN: 'http://127.0.0.1:4173',
	BETTER_AUTH_SECRET: 'e2e-build-only-secret'
};
const run = (cmd: string[]) => Bun.spawn(cmd, { env, stdout: 'inherit', stderr: 'inherit' }).exited;

let status = await run(['bun', 'run', 'build']);
if (status === 0)
	status = await run(['bunx', '--no-install', 'playwright', 'test', ...process.argv.slice(2)]);
process.exit(status);
