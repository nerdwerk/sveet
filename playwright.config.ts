import { defineConfig, devices } from '@playwright/test';

// Run via `bun run test:e2e`, which builds first; each test gets its own DB and server.
export default defineConfig({
	testDir: './tests/e2e',
	testMatch: '**/*.e2e.ts',
	fullyParallel: true,
	workers: 2,
	use: { trace: 'retain-on-failure' },
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
