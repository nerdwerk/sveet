import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-bun';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// BUILD_DIR: the sandbox can't execute binaries on host-mounted folders.
			adapter: adapter({ out: process.env.BUILD_DIR || 'build', buildOptions: { compile: true } })
		})
	],
	// In the sandbox, Vite must listen beyond the VM's own localhost for the port forward to reach it.
	server: { host: process.env.SVEET_SANDBOX ? '0.0.0.0' : undefined, strictPort: true },
	ssr: { external: ['bun:sqlite'] },
	test: {
		expect: { requireAssertions: true },
		// The default `forks` pool needs Node's IPC channel, which bun lacks.
		pool: 'threads',
		include: ['src/**/*.test.ts']
	}
});
