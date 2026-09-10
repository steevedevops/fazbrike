<script lang="ts">
	import type { CollectionMeta } from '$lib/types';
	import type { Snippet } from 'svelte';

	interface Props {
		collection?: CollectionMeta | null;
		onSearch?: (v: string) => void;
		searchPlaceholder?: string;
		actions?: Snippet;
	}
	let {
		collection = null,
		onSearch = () => {},
		searchPlaceholder = 'Pesquisar…',
		actions
	}: Props = $props();
</script>

<header class="topbar">
	<nav class="breadcrumb">
		<a href="/" class="crumb">Collections</a>
		<span class="sep">/</span>
		<span class="current">{collection?.label ?? '…'}</span>
	</nav>
	<div class="actions">
		{#if onSearch}
			<div class="search-wrap">
				<svg class="search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="11" cy="11" r="7" />
					<path d="m21 21-4.3-4.3" stroke-linecap="round" />
				</svg>
				<input
					type="search"
					oninput={(e) => onSearch(e.currentTarget.value)}
					placeholder={searchPlaceholder}
					class="search"
				/>
			</div>
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
		padding: 16px 0 0;
		margin-bottom: 18px;
	}
	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
	}
	.crumb {
		color: var(--text-muted);
		font-weight: 500;
	}
	.crumb:hover {
		color: var(--accent-strong);
	}
	.sep {
		color: #c0c3c9;
	}
	.current {
		color: var(--text);
		font-weight: 600;
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.search-wrap {
		position: relative;
	}
	.search-ico {
		position: absolute;
		left: 10px;
		top: 50%;
		transform: translateY(-50%);
		width: 15px;
		height: 15px;
		color: var(--text-muted);
		pointer-events: none;
	}
	.search {
		padding: 8px 12px 8px 32px;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		width: 240px;
		font-size: 13px;
		outline: none;
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	.search:focus {
		border-color: var(--accent-strong);
		box-shadow: 0 0 0 3px var(--accent-soft);
	}
</style>
