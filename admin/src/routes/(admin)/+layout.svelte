<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { currentUser, authLoading } from '$lib/auth';
	import { loadCollections, collections } from '$lib/meta';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}
	let { children }: Props = $props();

	onMount(() => {
		void loadCollections();
	});

	let navigated = $state(false);

	$effect(() => {
		if (navigated) return;
		if ($authLoading) return;
		if ($currentUser) {
			// Garante coleções no menu assim que o admin autenticar
			void loadCollections();
			return;
		}
		if (typeof window !== 'undefined') {
			navigated = true;
			goto('/login', { replaceState: true });
		}
	});
</script>

{#if $currentUser}
	<div class="shell">
		<Sidebar collections={$collections} />
		<main class="content">
			{@render children()}
		</main>
	</div>
{:else}
	<div class="boot"><div class="spinner"></div></div>
{/if}

<style>
	.shell {
		display: flex;
		min-height: 100vh;
		background: var(--canvas);
	}
	.content {
		flex: 1;
		min-width: 0;
		padding: 24px 28px 40px;
		max-width: 100%;
		animation: enter 0.2s ease-out;
	}
	@keyframes enter {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.boot {
		min-height: 100vh;
		display: grid;
		place-items: center;
		background: var(--canvas);
	}
</style>
