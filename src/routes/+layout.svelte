<script lang="ts">
	import './layout.css';
	import { resolve } from '$app/paths';
	import favicon from '#lib/assets/favicon.svg';
	import { APP } from '#lib/app.ts';

	let { data, children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{APP.name}</title>
	<meta name="description" content={APP.tagline} />
</svelte:head>

<div class="mx-auto flex min-h-dvh max-w-3xl flex-col px-6">
	<header class="flex items-center justify-between py-6">
		<a href={resolve('/')} class="font-semibold tracking-tight">{APP.name}</a>
		<nav class="text-sm">
			{#if data.user}
				<a href={resolve('/account')} class="text-muted-foreground hover:text-foreground">
					{data.user.email}
				</a>
			{:else}
				<a href={resolve('/login')} class="text-muted-foreground hover:text-foreground">Sign in</a>
			{/if}
		</nav>
	</header>

	<main class="flex-1 py-8">
		{@render children()}
	</main>

	<footer class="py-6 text-xs text-muted-foreground">
		Built with <a class="underline" href="https://github.com/nerdwerk/sveet" rel="external">
			sveet
		</a>
	</footer>
</div>
