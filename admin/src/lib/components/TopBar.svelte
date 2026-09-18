<script lang="ts">
	import type { CollectionMeta } from '$lib/types';
	import type { Snippet } from 'svelte';

	interface Props {
		collection?: CollectionMeta | null;
		onSearch?: (v: string) => void;
		searchPlaceholder?: string;
		title?: string;
		actions?: Snippet;
	}
	let {
		collection = null,
		onSearch,
		searchPlaceholder = 'Pesquisar…',
		title,
		actions
	}: Props = $props();

	const heading = $derived(title ?? collection?.label ?? '…');
</script>

<header class="topbar">
	<div class="left">
		<nav class="crumbs" aria-label="Navegação">
			<a href="/">Coleções</a>
			{#if collection || title}
				<span>/</span>
				<strong>{heading}</strong>
			{/if}
		</nav>
	</div>
	<div class="right">
		{#if onSearch}
			<label class="search">
				<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
					<circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.25" />
					<path d="M10.5 10.5 13.5 13.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" />
				</svg>
				<input type="search" oninput={(e) => onSearch(e.currentTarget.value)} placeholder={searchPlaceholder} />
			</label>
		{/if}
		{#if actions}
			{@render actions()}
		{/if}
	</div>
</header>

<style>
	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding-bottom: 16px;
		margin-bottom: 4px;
		border-bottom: 1px solid var(--border);
		flex-wrap: wrap;
	}
	.crumbs {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		letter-spacing: -0.02em;
	}
	.crumbs a {
		color: var(--muted);
		font-weight: 500;
	}
	.crumbs a:hover {
		color: var(--ink);
	}
	.crumbs span {
		color: var(--border-strong);
	}
	.crumbs strong {
		font-weight: 600;
		color: var(--ink);
	}
	.right {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.search {
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 7px 10px;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		min-width: 200px;
	}
	.search:focus-within {
		border-color: var(--ink);
		box-shadow: 0 0 0 3px var(--accent-soft);
	}
	.search svg {
		width: 13px;
		height: 13px;
		color: var(--faint);
		flex-shrink: 0;
	}
	.search input {
		border: none;
		outline: none;
		background: transparent;
		width: 100%;
		padding: 0;
		font-size: 13px;
	}
</style>
