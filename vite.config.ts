import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-bun';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// One self-contained executable at build/server: the app, its client
			// assets, every dependency and the bun runtime. The Docker image ships
			// that file plus drizzle/ and nothing else.
			// `BUILD_DIR` only exists for the microsandbox, where host-mounted files
			// can't be executed (see Sandboxfile).
			adapter: adapter({
				out: process.env.BUILD_DIR || 'build',
				buildOptions: { compile: true }
			})
		})
	],
	// Inside the microsandbox VM the dev server must listen on every interface,
	// or the port forward to the host's localhost:5173 has nothing to reach.
	server: { host: process.env.SVEET_SANDBOX ? '0.0.0.0' : undefined, strictPort: true },
	// bun:sqlite is a bun runtime builtin with no npm package behind it — keep it
	// external so the server bundle imports it from the runtime. This is also why
	// every script runs vite via `bun --bun`.
	ssr: { external: ['bun:sqlite'] },
	test: {
		expect: { requireAssertions: true },
		// Vitest's default `forks` pool expects Node's IPC channel, which bun
		// doesn't implement; workers run as threads instead.
		pool: 'threads',
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
