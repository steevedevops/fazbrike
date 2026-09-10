<script lang="ts">
	import { onMount } from 'svelte';
	import { initAuth } from '$lib/auth';
	import Toasts from '$lib/components/Toasts.svelte';
	import type { Snippet } from 'svelte';
	import '@fontsource-variable/inter';
	import '../app.css';

	interface Props {
		children: Snippet;
	}
	let { children }: Props = $props();

	let ready = $state(false);

	onMount(async () => {
		await initAuth();
		ready = true;
	});
</script>

{#if ready}
	{@render children()}
{/if}

<Toasts />
