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
</script>

<div class="sidebar-container">
	<!-- Coluna 1: Sidebar Estreito / Escuro (Padrão PocketBase) -->
	<aside class="sidebar-narrow">
		<a class="brand-logo" href="/" aria-label="Fazbrike Admin">
			<img src="/favicon.svg" alt="Logo Fazbrike" width="32" height="32" />
		</a>

		<nav class="nav-icons">
			<a
				class="nav-icon-btn"
				class:active={page.url.pathname !== '/settings'}
				href="/"
				title="Coleções"
				aria-label="Coleções"
			>
				<!-- Ícone de Base de Dados (Database stack) -->
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="narrow-ico">
					<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
					<path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
					<path d="M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6"></path>
				</svg>
			</a>

			<a
				class="nav-icon-btn"
				class:active={page.url.pathname === '/settings'}
				href="/settings"
				title="Configurações"
				aria-label="Configurações"
			>
				<!-- Ícone de Engrenagem (Settings) -->
				<svg class="narrow-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="3"></circle>
					<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
				</svg>
			</a>
		</nav>

		<div class="sidebar-narrow-footer">
			<div class="avatar-wrapper" title={$currentUser?.name ?? 'Admin'}>
				<div class="avatar-circle">{$currentUser?.name?.charAt(0).toUpperCase() ?? 'A'}</div>
			</div>

			<button class="logout-btn" title="Sair da conta" onclick={logoutClick} aria-label="Sair">
				<!-- Ícone de Logout -->
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="narrow-ico">
					<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
					<path d="M16 17l5-5-5-5" stroke-linecap="round" stroke-linejoin="round" />
					<path d="M21 12H9" stroke-linecap="round" />
				</svg>
			</button>
		</div>
	</aside>

	<!-- Coluna 2: Lista de Coleções (Omitida se estiver em /settings) -->
	{#if page.url.pathname !== '/settings'}
		<aside class="sidebar-collections">
			<div class="sidebar-header">
				<div class="collections-title">Coleções</div>
			</div>

			<div class="search-box">
				<svg class="search-box-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="11" cy="11" r="7" />
					<path d="m21 21-4.3-4.3" stroke-linecap="round" />
				</svg>
				<input
					bind:value={query}
					class="search-input"
					type="search"
					placeholder="Buscar coleção…"
					aria-label="Buscar coleção"
				/>
			</div>

			<ul class="collections-list">
				{#each filtered as c (c.name)}
					<a
						class="collection-link"
						class:active={page.url.pathname.startsWith(`/collections/${c.name}`)}
						href={`/collections/${c.name}`}
					>
						{#if c.name === 'user'}
							<!-- Ícone de Usuários (Auth) -->
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="collection-link-ico">
								<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
								<circle cx="12" cy="7" r="4"></circle>
							</svg>
						{:else}
							<!-- Ícone de Tabela (Base) -->
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="collection-link-ico">
								<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
								<line x1="9" y1="3" x2="9" y2="21"></line>
								<line x1="3" y1="9" x2="21" y2="9"></line>
								<line x1="3" y1="15" x2="21" y2="15"></line>
							</svg>
						{/if}
						<span class="collection-name">{c.label}</span>
					</a>
				{/each}
				{#if filtered.length === 0}
					<li class="empty-state">Nenhuma coleção encontrada</li>
				{/if}
			</ul>
		</aside>
	{/if}
</div>

<style>
	.sidebar-container {
		display: flex;
		height: 100vh;
		position: sticky;
		top: 0;
		flex-shrink: 0;
		user-select: none;
	}

	/* Coluna 1: Sidebar Fina / Escura */
	.sidebar-narrow {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 68px;
		height: 100vh;
		background: #11141e; /* Escuro PocketBase profundo */
		padding: 20px 0;
		flex-shrink: 0;
		border-right: 1px solid rgba(255, 255, 255, 0.02);
	}

	.brand-logo {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 12px;
		transition: transform 0.15s ease;
	}
	.brand-logo:hover {
		transform: scale(1.05);
	}

	.nav-icons {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		margin-top: 28px;
		flex: 1;
		width: 100%;
	}

	.nav-icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 10px;
		color: #718096;
		transition: background 0.13s, color 0.13s, transform 0.1s;
	}
	.nav-icon-btn:hover {
		background: rgba(255, 255, 255, 0.05);
		color: #fff;
		transform: scale(1.02);
	}
	.nav-icon-btn.active {
		background: var(--sidebar-active);
		color: var(--accent);
	}

	.narrow-ico {
		width: 20px;
		height: 20px;
	}

	.sidebar-narrow-footer {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		width: 100%;
	}

	.avatar-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--accent-strong), var(--accent-hover));
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.avatar-circle {
		color: #fff;
		font-weight: 700;
		font-size: 13px;
	}

	.logout-btn {
		background: none;
		border: none;
		color: #718096;
		padding: 8px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.13s, background 0.13s;
	}
	.logout-btn:hover {
		color: #f87171;
		background: rgba(239, 68, 68, 0.1);
	}

	/* Coluna 2: Lista de Coleções (Fundo Branco no padrão PocketBase) */
	.sidebar-collections {
		display: flex;
		flex-direction: column;
		width: 220px;
		height: 100vh;
		background: #ffffff;
		border-right: 1px solid var(--border);
		padding: 18px 10px;
		flex-shrink: 0;
	}

	.sidebar-header {
		padding: 4px 10px 12px;
	}

	.collections-title {
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 1px;
		color: #8fa0b5; /* Azul-acinzentado PocketBase */
	}

	.search-box {
		position: relative;
		margin: 0 6px 14px;
	}

	.search-box-ico {
		position: absolute;
		left: 10px;
		top: 50%;
		transform: translateY(-50%);
		width: 14px;
		height: 14px;
		color: #a0aec0;
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 8px 10px 8px 30px;
		border-radius: 8px;
		border: 1px solid #e2e8f0;
		background: #f8fafc;
		color: var(--text);
		outline: none;
		font-size: 12.5px;
		transition: border-color 0.15s, box-shadow 0.15s, background-color 0.15s;
	}
	.search-input::placeholder {
		color: #a0aec0;
	}
	.search-input:focus {
		background: #ffffff;
		border-color: var(--accent-strong);
		box-shadow: 0 0 0 3px var(--accent-soft);
	}

	.collections-list {
		list-style: none;
		margin: 0;
		padding: 0;
		overflow-y: auto;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.collection-link {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 10px 8px 8px;
		border-radius: 8px;
		color: var(--text-muted);
		font-size: 13px;
		font-weight: 500;
		transition: background 0.1s, color 0.13s;
		border-left: 3px solid transparent;
	}
	.collection-link:hover {
		background: #f8fafc;
		color: var(--text);
	}
	.collection-link.active {
		background: #eefbf4;
		color: var(--accent-strong);
		font-weight: 600;
		border-left-color: var(--accent);
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
	}

	.collection-link-ico {
		width: 16px;
		height: 16px;
		color: #a0aec0;
		flex-shrink: 0;
		transition: color 0.13s;
	}
	.collection-link:hover .collection-link-ico {
		color: var(--text);
	}
	.collection-link.active .collection-link-ico {
		color: var(--accent-strong);
	}

	.collection-name {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.empty-state {
		font-size: 12px;
		color: var(--text-muted);
		padding: 10px;
		text-align: center;
	}
</style>
