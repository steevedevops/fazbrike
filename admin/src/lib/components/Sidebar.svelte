<script lang="ts">
	import { page } from '$app/state';
	import { currentUser, logout } from '$lib/auth';
	import { goto } from '$app/navigation';
	import type { CollectionMeta } from '$lib/types';

	let { collections }: { collections: CollectionMeta[] } = $props();

	let query = $state('');

	const filtered = $derived.by(() => {
		const q = query.toLowerCase().trim();
		if (!q) return collections;
		return collections.filter((c) => c.label.toLowerCase().includes(q));
	});

	function logoutClick() {
		logout();
		goto('/login');
	}

	const isOverview = $derived(page.url.pathname === '/');
	const isVisits = $derived(page.url.pathname.startsWith('/visits'));
	const isBackup = $derived(page.url.pathname.startsWith('/backup'));
	const isSettings = $derived(page.url.pathname.startsWith('/settings'));
</script>

<aside class="sidebar">
	<a class="brand" href="/">
		<span class="mark">F</span>
		<span class="brand-copy">
			<strong>Fazbrike</strong>
			<small>Admin</small>
		</span>
	</a>

	<nav class="nav" aria-label="Principal">
		<a class="nav-item" class:active={isOverview} href="/">
			<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
				<path d="M2 2.5h5v5H2v-5Zm7 0h5v5H9v-5ZM2 9.5h5v5H2v-5Zm7 0h5v5H9v-5Z" stroke="currentColor" stroke-width="1.25" />
			</svg>
			Visão geral
		</a>
		<a class="nav-item" class:active={isVisits} href="/visits">
			<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
				<path d="M1.5 13.5v-4M6 13.5v-7M10.5 13.5v-9M15 13.5v-2.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" />
			</svg>
			Visitas
		</a>
		<a class="nav-item" class:active={isBackup} href="/backup">
			<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
				<path d="M2 4.5c0-1.1 2.7-2 6-2s6 .9 6 2-2.7 2-6 2-6-.9-6-2Z" stroke="currentColor" stroke-width="1.25" />
				<path d="M2 4.5V11.5c0 1.1 2.7 2 6 2s6-.9 6-2V4.5" stroke="currentColor" stroke-width="1.25" />
				<path d="M2 8c0 1.1 2.7 2 6 2s6-.9 6-2" stroke="currentColor" stroke-width="1.25" />
			</svg>
			Backup
		</a>
		<a class="nav-item" class:active={isSettings} href="/settings">
			<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
				<circle cx="8" cy="8" r="2.25" stroke="currentColor" stroke-width="1.25" />
				<path
					d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"
					stroke="currentColor"
					stroke-width="1.25"
					stroke-linecap="round"
				/>
			</svg>
			Configurações
		</a>
	</nav>

	<div class="collections">
		<div class="section-head">
			<span>Coleções</span>
			<span class="count">{collections.length}</span>
		</div>
		{#if collections.length > 5}
			<label class="search">
				<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
					<circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.25" />
					<path d="M10.5 10.5 13.5 13.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" />
				</svg>
				<input bind:value={query} type="search" placeholder="Filtrar" aria-label="Filtrar coleções" />
			</label>
		{/if}
		<ul>
			{#each filtered as c (c.name)}
				<li>
					<a
						class="col"
						class:active={page.url.pathname.startsWith(`/collections/${c.name}`)}
						href={`/collections/${c.name}`}
					>
						{c.label}
					</a>
				</li>
			{/each}
			{#if filtered.length === 0}
				<li class="empty">{collections.length === 0 ? 'Carregando…' : 'Nada encontrado'}</li>
			{/if}
		</ul>
	</div>

	<div class="foot">
		<div class="user">
			<span class="avatar">{$currentUser?.name?.charAt(0).toUpperCase() ?? 'A'}</span>
			<div class="meta">
				<span class="name">{$currentUser?.name ?? 'Admin'}</span>
				<span class="email">{$currentUser?.email ?? ''}</span>
			</div>
		</div>
		<button type="button" class="out" onclick={logoutClick} title="Sair" aria-label="Sair">
			<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
				<path d="M6 2H3.5A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14H6" stroke="currentColor" stroke-width="1.25" />
				<path d="M10.5 11.5 14 8l-3.5-3.5M14 8H6" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</button>
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
		flex-direction: column;
		background: var(--surface);
		border-right: 1px solid var(--border);
		padding: 16px 12px 12px;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 4px 8px 14px;
		margin-bottom: 4px;
	}
	.mark {
		width: 28px;
		height: 28px;
		border-radius: 7px;
		background: var(--ink);
		color: #fff;
		display: grid;
		place-items: center;
		font-size: 13px;
		font-weight: 700;
		letter-spacing: -0.04em;
	}
	.brand-copy {
		display: flex;
		flex-direction: column;
		line-height: 1.15;
	}
	.brand-copy strong {
		font-size: 13.5px;
		font-weight: 650;
		letter-spacing: -0.03em;
	}
	.brand-copy small {
		font-size: 11px;
		color: var(--faint);
		font-weight: 500;
	}

	.nav {
		display: flex;
		flex-direction: column;
		gap: 1px;
		margin-bottom: 12px;
	}
	.nav-item {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 8px 10px;
		border-radius: var(--radius-sm);
		color: var(--muted);
		font-size: 13px;
		font-weight: 500;
		letter-spacing: -0.01em;
		transition: background 0.1s, color 0.1s;
	}
	.nav-item svg {
		width: 14px;
		height: 14px;
		opacity: 0.75;
	}
	.nav-item:hover {
		background: var(--subtle);
		color: var(--ink);
	}
	.nav-item.active {
		background: var(--subtle);
		color: var(--ink);
		font-weight: 600;
	}

	.collections {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}
	.section-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 10px 6px;
		font-size: 10.5px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--faint);
	}
	.count {
		font-variant-numeric: tabular-nums;
		color: var(--faint);
		background: var(--subtle);
		padding: 1px 6px;
		border-radius: 999px;
		font-size: 10px;
	}

	.search {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 0 4px 6px;
		padding: 6px 8px;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--subtle);
	}
	.search:focus-within {
		border-color: var(--border-strong);
		background: var(--surface);
	}
	.search svg {
		width: 13px;
		height: 13px;
		color: var(--faint);
		flex-shrink: 0;
	}
	.search input {
		border: none;
		background: transparent;
		outline: none;
		width: 100%;
		padding: 0;
		font-size: 12.5px;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		overflow-y: auto;
		flex: 1;
	}
	.col {
		display: block;
		padding: 7px 10px;
		margin: 0 2px;
		border-radius: var(--radius-sm);
		color: var(--muted);
		font-size: 13px;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		transition: background 0.1s, color 0.1s;
	}
	.col:hover {
		background: var(--subtle);
		color: var(--ink);
	}
	.col.active {
		background: var(--ink);
		color: #fff;
		font-weight: 550;
	}
	.empty {
		padding: 12px;
		text-align: center;
		color: var(--faint);
		font-size: 12px;
	}

	.foot {
		display: flex;
		align-items: center;
		gap: 6px;
		padding-top: 10px;
		margin-top: 8px;
		border-top: 1px solid var(--border);
	}
	.user {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
		flex: 1;
		padding: 2px 4px;
	}
	.avatar {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: var(--subtle);
		border: 1px solid var(--border);
		color: var(--ink);
		display: grid;
		place-items: center;
		font-size: 11px;
		font-weight: 650;
		flex-shrink: 0;
	}
	.meta {
		min-width: 0;
		display: flex;
		flex-direction: column;
		line-height: 1.2;
	}
	.name {
		font-size: 12px;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.email {
		font-size: 10.5px;
		color: var(--faint);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.out {
		border: none;
		background: transparent;
		color: var(--faint);
		padding: 7px;
		border-radius: var(--radius-xs);
		display: grid;
		place-items: center;
	}
	.out svg {
		width: 14px;
		height: 14px;
	}
	.out:hover {
		color: var(--danger);
		background: var(--danger-soft);
	}
</style>
