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
		const from = Math.max(1, cur - 2);
		const to = Math.min(total, cur + 2);
		for (let i = from; i <= to; i++) out.push(i);
		return out;
	});
</script>

<footer class="pagination">
	<div class="info">
		{result.total.toLocaleString('pt-BR')} registro{result.total === 1 ? '' : 's'}
		<span class="dot">·</span>
		página {current} de {Math.max(result.totalPages, 1)}
	</div>
	<div class="controls">
		<select
			value={String(result.perPage)}
			onchange={(e) => onPerPage(Number(e.currentTarget.value))}
			aria-label="Registros por página"
		>
			{#each [10, 20, 30, 50, 100] as n}
				<option value={n} selected={result.perPage === n}>{n} / pág.</option>
			{/each}
		</select>

		<button class="page" type="button" disabled={result.page <= 1} onclick={() => onPage(result.page - 1)} aria-label="Anterior">
			‹
		</button>
		{#each pages as p (p)}
			<button class="page" type="button" class:active={p === current} onclick={() => onPage(p)}>
				{p}
			</button>
		{/each}
		<button
			class="page"
			type="button"
			disabled={result.page >= result.totalPages}
			onclick={() => onPage(result.page + 1)}
			aria-label="Próxima"
		>
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
		padding: 16px 2px 0;
		font-size: 13px;
		color: var(--muted);
		flex-wrap: wrap;
	}
	.dot {
		margin: 0 4px;
		color: var(--border-strong);
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	select {
		padding: 6px 10px;
		min-width: 100px;
		cursor: pointer;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		font-size: 12.5px;
		outline: none;
		margin-right: 6px;
	}
	select:focus {
		border-color: var(--accent);
	}
	.page {
		min-width: 32px;
		height: 32px;
		padding: 0 8px;
		border: 1px solid transparent;
		border-radius: var(--radius-xs);
		background: transparent;
		color: var(--muted);
		font-size: 13px;
		font-weight: 500;
		transition: all 0.12s;
	}
	.page:hover:not(:disabled):not(.active) {
		background: var(--subtle);
		color: var(--ink);
	}
	.page.active {
		background: var(--ink);
		color: #fff;
	}
	.page:disabled {
		opacity: 0.35;
		cursor: default;
	}
</style>
