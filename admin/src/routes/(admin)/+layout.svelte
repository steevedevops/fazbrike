<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { currentUser, authLoading } from '$lib/auth';
	import { loadCollections, collections } from '$lib/meta';
	import { breadcrumb, buildSections } from '$lib/nav';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}
	let { children }: Props = $props();

	let navOpen = $state(false);

	onMount(() => {
		void loadCollections();
	});

	let navigated = $state(false);

	$effect(() => {
		if (navigated) return;
		if ($authLoading) return;
		if ($currentUser) {
			void loadCollections();
			return;
		}
		if (typeof window !== 'undefined') {
			navigated = true;
			goto('/login', { replaceState: true });
		}
	});

	const sections = $derived(buildSections($collections));
	const crumbs = $derived(breadcrumb(sections, page.url.pathname));

	$effect(() => {
		page.url.pathname;
		navOpen = false;
	});
</script>

{#if $currentUser}
	<div class="shell">
		{#if navOpen}
			<button class="scrim" type="button" aria-label="Fechar menu" onclick={() => (navOpen = false)}></button>
		{/if}
		<Sidebar collections={$collections} mobileOpen={navOpen} onNavigate={() => (navOpen = false)} />
		<div class="inset">
			<header class="inset-header">
				<button class="menu-btn" type="button" aria-label="Abrir menu" onclick={() => (navOpen = true)}>
					<Icon name="menu" size={18} />
				</button>
				<nav class="crumbs" aria-label="Localização">
					{#each crumbs as crumb, i (crumb.label + i)}
						{#if i > 0}<span class="sep">/</span>{/if}
						{#if crumb.href && i < crumbs.length - 1}
							<a href={crumb.href}>{crumb.label}</a>
						{:else}
							<strong>{crumb.label}</strong>
						{/if}
					{/each}
				</nav>
			</header>
			<main class="content">
				{@render children()}
			</main>
		</div>
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
	.inset {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
	.inset-header {
		height: 56px;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 0 20px;
		border-bottom: 1px solid var(--border);
		background: color-mix(in srgb, var(--surface) 85%, transparent);
		backdrop-filter: blur(8px);
		position: sticky;
		top: 0;
		z-index: 20;
	}
	.menu-btn {
		display: none;
		width: 36px;
		height: 36px;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--ink);
		place-items: center;
		box-shadow: var(--shadow-xs);
	}
	.crumbs {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
		font-size: 13.5px;
		color: var(--muted);
	}
	.crumbs a:hover {
		color: var(--ink);
	}
	.crumbs strong {
		color: var(--ink);
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.sep {
		color: var(--border-strong);
	}
	.content {
		flex: 1;
		min-width: 0;
		padding: 28px 32px 48px;
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
	.scrim {
		display: none;
	}

	@media (max-width: 960px) {
		.menu-btn,
		.scrim {
			display: grid;
		}
		.scrim {
			position: fixed;
			inset: 0;
			z-index: 30;
			border: none;
			background: rgba(9, 9, 11, 0.45);
		}
		.content {
			padding: 20px 16px 40px;
		}
		.inset-header {
			padding: 0 12px;
		}
	}
</style>
