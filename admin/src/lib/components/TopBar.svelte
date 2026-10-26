<script lang="ts">
	import type { CollectionMeta } from '$lib/types';
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

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

<header class="page-head">
	<div class="titles">
		<h1 class="page-title">{heading}</h1>
		{#if collection}
			<p class="page-sub">{collection.name}</p>
		{/if}
	</div>
	<div class="right">
		{#if onSearch}
			<label class="search">
				<Icon name="search" size={15} />
				<input type="search" oninput={(e) => onSearch(e.currentTarget.value)} placeholder={searchPlaceholder} />
			</label>
		{/if}
		{#if actions}
			{@render actions()}
		{/if}
	</div>
</header>

<style>
	.page-head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 16px;
		flex-wrap: wrap;
	}
	.titles {
		min-width: 0;
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
		gap: 8px;
		height: 36px;
		padding: 0 12px;
		border: 1px solid var(--input);
		border-radius: var(--radius-sm);
		background: var(--surface);
		min-width: 240px;
		color: var(--faint);
		box-shadow: var(--shadow-xs);
	}
	.search:focus-within {
		border-color: var(--ring);
		box-shadow: 0 0 0 3px var(--ring-soft);
	}
	.search input {
		border: none;
		outline: none;
		background: transparent;
		width: 100%;
		height: 100%;
		padding: 0;
		font-size: 13.5px;
		box-shadow: none;
	}

	@media (max-width: 720px) {
		.search {
			min-width: 0;
			width: 100%;
		}
	}
</style>
