import { defineConfig, devices } from '@playwright/test';

// Run through `bun run test:e2e`, which builds the app first. Every test gets
// its own seeded database and server (tests/e2e/fixtures.ts), so tests run in
// parallel and never touch local.db.
export default defineConfig({
	testDir: './tests/e2e',
	testMatch: '**/*.e2e.ts',
	fullyParallel: true,
	workers: 2,
	retries: 0,
	use: { trace: 'retain-on-failure', screenshot: 'only-on-failure' },
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
