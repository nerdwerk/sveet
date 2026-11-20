<script lang="ts">
	import { resolve } from '$app/paths';
	import { APP } from '#lib/app.ts';

	let { data } = $props();

	const steps = [
		['Personalize', 'Ask your agent to run the sveet-setup skill — name, deploy target, mail.'],
		['Model your data', 'Edit src/lib/server/db/schema.ts, then bun run db:generate.'],
		['Build', 'Compose pages from @ui-sdk/svelte components; theme them in layout.css.'],
		['Ship', 'bun run deploy — verifies, then deploys to Fly.io.']
	] as const;
</script>

<section class="flex flex-col gap-4">
	<h1 class="text-4xl font-semibold tracking-tight text-balance">{APP.name}</h1>
	<p class="max-w-prose text-lg text-muted-foreground">{APP.tagline}</p>
	<div class="flex gap-3 pt-2">
		{#if data.user}
			<a class="underline" href={resolve('/account')}>Go to your account</a>
		{:else}
			<a class="underline" href={resolve('/login')}>Sign in with a magic link</a>
		{/if}
	</div>
</section>

<section class="mt-14">
	<h2 class="text-sm font-medium tracking-wider text-muted-foreground uppercase">Next steps</h2>
	<ol class="mt-4 grid gap-4 sm:grid-cols-2">
		{#each steps as [title, body] (title)}
			<li class="rounded-lg border p-4">
				<p class="font-medium">{title}</p>
				<p class="mt-1 text-sm text-muted-foreground">{body}</p>
			</li>
		{/each}
	</ol>
</section>
