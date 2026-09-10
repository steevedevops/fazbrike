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
		loadCollections();
	});

	// Guard de rota SEM loop: só navega uma vez quando o estado de auth está resolvido.
	// `navigated` evita repetir goto('/login') a cada re-avaliação do efeito.
	let navigated = false;

	$effect(() => {
		if (navigated) return;
		if ($authLoading) return;
		if ($currentUser) return;
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
	}
	.content {
		flex: 1;
		padding: 26px 32px 48px;
		max-width: 100%;
	}
	.boot {
		min-height: 100vh;
		display: grid;
		place-items: center;
		background: var(--sidebar-bg);
	}
	.spinner {
		width: 34px;
		height: 34px;
		border: 3px solid #3a3f4b;
		border-top-color: var(--accent-strong);
		border-radius: 50%;
		animation: rot 0.8s linear infinite;
	}
	@keyframes rot {
		to {
			transform: rotate(360deg);
		}
	}
</style>
