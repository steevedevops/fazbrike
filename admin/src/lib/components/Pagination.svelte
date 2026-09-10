<script lang="ts">
	import type { ListResponse } from '$lib/types';

	interface Props {
		result: ListResponse;
		onPage: (page: number) => void;
		onPerPage: (n: number) => void;
	}
	let { result, onPage, onPerPage }: Props = $props();

	let current = $derived(Math.min(result.page, Math.max(result.totalPages, 1)));
	const pages = $derived.by(() => {
		const total = Math.max(result.totalPages, 1);
		const cur = current;
		const out: number[] = [];
		const from = Math.max(1, cur - 4);
		const to = Math.min(total, cur + 4);
		for (let i = from; i <= to; i++) out.push(i);
		return out;
	});
</script>

<footer class="pagination">
	<div class="info">
		Página {current} de {Math.max(result.totalPages, 1)} · {result.total} registro(s)
	</div>
	<div class="controls">
		<select
			value={String(result.perPage)}
			onchange={(e) => onPerPage(Number(e.currentTarget.value))}
			aria-label="Registros por página"
		>
			{#each [10, 20, 30, 50, 100] as n}
				<option value={n} selected={result.perPage === n}>{n} / página</option>
			{/each}
		</select>

		<button class="page" disabled={result.page <= 1} onclick={() => onPage(result.page - 1)}>
			‹
		</button>
		{#each pages as p (p)}
			<button class="page" class:active={p === current} onclick={() => onPage(p)}>
				{p}
			</button>
		{/each}
		<button class="page" disabled={result.page >= result.totalPages} onclick={() => onPage(result.page + 1)}>
			›
		</button>
	</div>
</footer>

<style>
	.pagination {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 14px 4px 4px;
		font-size: 13px;
		color: var(--text-muted);
		flex-wrap: wrap;
	}
	.info {
		font-size: 13px;
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	select {
		padding: 6px 28px 6px 12px;
		min-width: 140px;
		cursor: pointer;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		background: #fff;
		font-size: 13px;
		outline: none;
		transition: border-color 0.15s;
	}
	select:focus {
		border-color: var(--accent-strong);
	}
	.page {
		width: 32px;
		height: 32px;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		background: #fff;
		color: var(--text);
		font-size: 13px;
		font-weight: 500;
		transition: all 0.12s;
	}
	.page:hover:not(:disabled) {
		border-color: var(--accent-strong);
		color: var(--accent-strong);
	}
	.page.active {
		background: var(--accent-strong);
		border-color: var(--accent-strong);
		color: #fff;
		box-shadow: 0 2px 6px rgba(31, 165, 115, 0.3);
	}
	.page:disabled {
		opacity: 0.4;
		cursor: default;
	}
</style>
