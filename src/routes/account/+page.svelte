<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '@ui-sdk/svelte/button';
	import { APP } from '#lib/app.ts';

	let { data } = $props();
</script>

<svelte:head><title>Account — {APP.name}</title></svelte:head>

<section class="flex items-start justify-between gap-4">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Your account</h1>
		<p class="text-muted-foreground">{data.user?.email}</p>
	</div>
	<form method="post" action="?/signOut" use:enhance>
		<Button type="submit">Sign out</Button>
	</form>
</section>
