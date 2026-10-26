<script lang="ts">
	import { page } from '$app/state';
	import { currentUser, logout } from '$lib/auth';
	import { goto } from '$app/navigation';
	import { onMount, untrack } from 'svelte';
	import type { CollectionMeta } from '$lib/types';
	import { loadModerationSummary, moderationSummary } from '$lib/moderation';
	import { activeSectionId, buildSections, itemIsActive } from '$lib/nav';
	import Icon from './Icon.svelte';

	let {
		collections,
		mobileOpen = false,
		onNavigate
	}: {
		collections: CollectionMeta[];
		mobileOpen?: boolean;
		onNavigate?: () => void;
	} = $props();

	let query = $state('');
	let picked = $state<string | null>(null);
	let lastPath = '';

	const sections = $derived(buildSections(collections));
	const routeSection = $derived(activeSectionId(sections, page.url.pathname));
	const active = $derived(
		sections.find((section) => section.id === (picked ?? routeSection ?? 'painel')) ?? sections[0]
	);
	const items = $derived.by(() => {
		if (!active) return [];
		const q = query.trim().toLowerCase();
		if (!q) return active.items;
		return active.items.filter((item) => item.label.toLowerCase().includes(q));
	});

	function logoutClick() {
		logout();
		goto('/login');
	}

	function select(id: string) {
		picked = id;
		query = '';
	}

	onMount(() => {
		const refresh = () => void loadModerationSummary().catch(() => undefined);
		refresh();
		const timer = window.setInterval(refresh, 30000);
		return () => window.clearInterval(timer);
	});

	$effect(() => {
		const path = page.url.pathname;
		untrack(() => {
			if (path === lastPath) return;
			lastPath = path;
			picked = null;
			query = '';
		});
	});
</script>

<aside class="sidebar" class:open={mobileOpen}>
	<div class="rail" aria-label="Categorias">
		<a class="mark" href="/" title="Início" onclick={() => onNavigate?.()}>F</a>
		<nav class="rail-nav">
			{#each sections as section (section.id)}
				<button
					type="button"
					class="rail-btn"
					class:active={active?.id === section.id}
					title={section.label}
					aria-label={section.label}
					aria-current={active?.id === section.id ? 'true' : undefined}
					onclick={() => select(section.id)}
				>
					<Icon name={section.icon} size={20} />
					{#if section.id === 'painel' && $moderationSummary.total > 0}
						<span class="rail-badge" aria-label={`${$moderationSummary.total} alertas pendentes`}>
							{$moderationSummary.total > 9 ? '9+' : $moderationSummary.total}
						</span>
					{/if}
				</button>
			{/each}
		</nav>
		<div class="rail-foot">
			<span class="avatar" title={$currentUser?.name ?? 'Admin'}>
				{$currentUser?.name?.charAt(0).toUpperCase() ?? 'A'}
			</span>
			<button type="button" class="rail-btn out" onclick={logoutClick} title="Sair" aria-label="Sair">
				<Icon name="log-out" size={18} />
			</button>
		</div>
	</div>

	<div class="panel">
		{#if active}
			<header class="panel-head">
				<h2>{active.label}</h2>
				<p>{active.blurb}</p>
			</header>
			<label class="search">
				<Icon name="search" size={15} />
				<input bind:value={query} type="search" placeholder="Buscar" aria-label={`Buscar em ${active.label}`} />
			</label>
			<nav class="list" aria-label={active.label}>
				{#each items as item (item.id)}
					<a
						class="item"
						class:active={itemIsActive(page.url.pathname, item.href)}
						href={item.href}
						onclick={() => onNavigate?.()}
					>
						<span class="item-icon"><Icon name={item.icon} size={16} /></span>
						<span class="item-label">{item.label}</span>
						{#if item.id === 'moderation' && $moderationSummary.total > 0}
							<span class="count">{$moderationSummary.total > 99 ? '99+' : $moderationSummary.total}</span>
						{/if}
					</a>
				{:else}
					<p class="empty">Nada encontrado</p>
				{/each}
			</nav>
		{/if}
	</div>
</aside>

<style>
	.sidebar {
		width: var(--sidebar-w);
		height: 100vh;
		position: sticky;
		top: 0;
		flex-shrink: 0;
		display: flex;
		background: var(--surface);
		border-right: 1px solid var(--border);
	}

	.rail {
		width: var(--rail-w);
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 12px 0;
		background: #18181b;
		color: #d4d4d8;
	}
	.mark {
		width: 40px;
		height: 40px;
		border-radius: 12px;
		display: grid;
		place-items: center;
		background: #fff;
		color: #18181b;
		font-weight: 700;
		font-size: 15px;
		letter-spacing: -0.04em;
		margin-bottom: 6px;
	}
	.rail-nav {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		width: 100%;
		padding: 0 8px;
	}
	.rail-nav::-webkit-scrollbar {
		width: 0;
	}
	.rail-btn {
		position: relative;
		width: 44px;
		height: 44px;
		border: none;
		border-radius: 14px;
		background: transparent;
		color: #a1a1aa;
		display: grid;
		place-items: center;
		flex-shrink: 0;
	}
	.rail-btn:hover {
		background: rgba(255, 255, 255, 0.08);
		color: #fff;
	}
	.rail-btn.active {
		background: #3f3f46;
		color: #fff;
	}
	.rail-badge {
		position: absolute;
		top: 4px;
		right: 2px;
		min-width: 16px;
		height: 16px;
		padding: 0 4px;
		border-radius: 999px;
		background: var(--danger);
		color: #fff;
		font-size: 9px;
		font-weight: 700;
		display: grid;
		place-items: center;
		line-height: 1;
	}
	.rail-foot {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding-top: 8px;
	}
	.avatar {
		width: 36px;
		height: 36px;
		border-radius: 999px;
		background: #3f3f46;
		color: #fff;
		display: grid;
		place-items: center;
		font-size: 13px;
		font-weight: 650;
	}
	.out:hover {
		color: #fecaca;
		background: rgba(220, 38, 38, 0.25);
	}

	.panel {
		width: var(--panel-w);
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 16px 12px 12px;
		background: var(--sidebar);
	}
	.panel-head h2 {
		font-size: 20px;
		font-weight: 650;
		letter-spacing: -0.03em;
		line-height: 1.2;
	}
	.panel-head p {
		margin-top: 2px;
		font-size: 12.5px;
		color: var(--muted);
	}
	.search {
		display: flex;
		align-items: center;
		gap: 8px;
		height: 36px;
		padding: 0 10px;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		color: var(--faint);
		box-shadow: var(--shadow-xs);
	}
	.search:focus-within {
		border-color: var(--ring);
		box-shadow: 0 0 0 3px var(--ring-soft);
	}
	.search input {
		border: none;
		background: transparent;
		outline: none;
		width: 100%;
		height: 100%;
		padding: 0;
		font-size: 13px;
		box-shadow: none;
	}
	.list {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.item {
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 40px;
		padding: 6px 8px;
		border-radius: 10px;
		color: var(--ink);
		font-size: 13.5px;
		font-weight: 500;
	}
	.item:hover {
		background: var(--subtle);
	}
	.item.active {
		background: var(--subtle);
		box-shadow: inset 0 0 0 1px var(--border);
		font-weight: 600;
	}
	.item-icon {
		width: 28px;
		height: 28px;
		border-radius: 8px;
		display: grid;
		place-items: center;
		background: var(--surface);
		border: 1px solid var(--border);
		color: var(--muted);
		flex-shrink: 0;
	}
	.item.active .item-icon {
		background: var(--ink);
		border-color: var(--ink);
		color: #fff;
	}
	.item-label {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.count {
		margin-left: auto;
		min-width: 20px;
		height: 20px;
		padding: 0 6px;
		border-radius: 999px;
		background: var(--danger);
		color: #fff;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 10px;
		font-weight: 700;
	}
	.empty {
		padding: 20px 8px;
		text-align: center;
		color: var(--faint);
		font-size: 13px;
	}

	@media (max-width: 960px) {
		.sidebar {
			position: fixed;
			z-index: 40;
			transform: translateX(-105%);
			transition: transform 0.18s ease;
			box-shadow: var(--shadow-md);
		}
		.sidebar.open {
			transform: translateX(0);
		}
	}
</style>
