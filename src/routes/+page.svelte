<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<svelte:head>
	<title>sveet</title>
	<meta name="description" content="An opinionated SvelteKit starter." />
</svelte:head>

<main class="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-8 px-6 py-16">
	<div class="flex flex-col gap-3">
		<h1 class="text-4xl font-bold tracking-tight">sveet</h1>
		<p class="text-muted-foreground text-lg">
			An opinionated SvelteKit starter — Drizzle + libSQL, Better Auth, shadcn-svelte, Tailwind 4,
			devbox + bun, and Fly.io deploy, with the Svelte MCP and a committed shadcn-svelte skill wired
			in for AI-assisted development.
		</p>
	</div>

	<div class="flex flex-wrap gap-3">
		<Button href="/demo/better-auth">Auth demo</Button>
		<Button href="https://svelte.dev/docs/kit" variant="outline">SvelteKit docs</Button>
		<Button href="https://www.shadcn-svelte.com/docs/components" variant="ghost">
			Add components
		</Button>
	</div>

	<div class="text-muted-foreground border-t pt-6 text-sm">
		<p class="mb-2 font-medium text-foreground">Next steps</p>
		<ul class="list-inside list-disc space-y-1">
			<li><code>bun run db:migrate</code> — apply the schema to your local database</li>
			<li><code>bunx shadcn-svelte add card input label</code> — pull in more UI components</li>
			<li>Edit the theme tokens in <code>src/routes/layout.css</code> to restyle everything</li>
			<li>See <code>README.md</code> for the Fly.io deploy flow</li>
		</ul>
	</div>
</main>
