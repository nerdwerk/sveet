<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '@ui-sdk/svelte/button';
	import { Field, FieldError, FieldLabel } from '@ui-sdk/svelte/field';
	import { Textarea } from '@ui-sdk/svelte/textarea';
	import { APP } from '#lib/app.ts';

	let { data, form } = $props();
</script>

<svelte:head><title>Account — {APP.name}</title></svelte:head>

<div class="flex flex-col gap-10">
	<section class="flex items-start justify-between gap-4">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">Your account</h1>
			<p class="text-muted-foreground">{data.user?.email}</p>
		</div>
		<form method="post" action="?/signOut" use:enhance>
			<Button type="submit">Sign out</Button>
		</form>
	</section>

	<section class="flex flex-col gap-4">
		<h2 class="text-lg font-medium">Notes</h2>
		<form
			method="post"
			action="?/addNote"
			class="flex flex-col gap-3"
			use:enhance={() =>
				async ({ update }) => {
					await update({ reset: true });
				}}
		>
			<Field name="body" invalid={form?.message ? true : undefined}>
				<FieldLabel>New note</FieldLabel>
				<Textarea required maxlength={500} />
				<FieldError>
					{#snippet children(state)}{form?.message || state.message}{/snippet}
				</FieldError>
			</Field>
			<Button type="submit" data-variant="solid" class="self-start">Add note</Button>
		</form>

		{#if data.notes.length}
			<ul class="flex flex-col divide-y rounded-lg border">
				{#each data.notes as item (item.id)}
					<li class="p-4 text-sm whitespace-pre-line">{item.body}</li>
				{/each}
			</ul>
		{:else}
			<p class="text-sm text-muted-foreground">No notes yet.</p>
		{/if}
	</section>
</div>
