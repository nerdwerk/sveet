<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '@ui-sdk/svelte/button';
	import { Field, FieldError, FieldLabel } from '@ui-sdk/svelte/field';
	import { Input } from '@ui-sdk/svelte/input';
	import { APP } from '#lib/app.ts';

	let { form } = $props();
</script>

<svelte:head><title>Sign in — {APP.name}</title></svelte:head>

<div class="mx-auto flex max-w-sm flex-col gap-6">
	{#if form?.sent}
		<div class="flex flex-col gap-2" role="status">
			<h1 class="text-2xl font-semibold tracking-tight">Check your inbox</h1>
			<p class="text-muted-foreground">
				We sent a sign-in link to <strong class="text-foreground">{form.email}</strong>. It works
				once and expires in a few minutes.
			</p>
		</div>
	{:else}
		<div class="flex flex-col gap-2">
			<h1 class="text-2xl font-semibold tracking-tight">Sign in</h1>
			<p class="text-muted-foreground">No password — we email you a link. New here? Same form.</p>
		</div>
		<form method="post" use:enhance class="flex flex-col gap-4">
			<Field name="email" invalid={form?.message ? true : undefined}>
				<FieldLabel>Email</FieldLabel>
				<Input type="email" autocomplete="email" required defaultValue={form?.email ?? ''} />
				<FieldError>
					{#snippet children(state)}{form?.message || state.message}{/snippet}
				</FieldError>
			</Field>
			<Button type="submit" data-variant="solid">Email me a link</Button>
		</form>
	{/if}
</div>
