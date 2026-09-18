<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api';
	import { toast } from '$lib/toast';
	import type { VisitsStatsResponse } from '$lib/types';

	let data = $state<VisitsStatsResponse | null>(null);
	let loading = $state(true);

	const maxCount = $derived.by(() => {
		if (!data || data.daily.length === 0) return 1;
		return Math.max(1, ...data.daily.map((d) => d.count));
	});

	function formatDay(iso: string): string {
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return iso;
		return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
	}

	onMount(async () => {
		try {
			data = await api.visitsStats(30);
		} catch (e) {
			toast('error', 'Não foi possível carregar as visitas.');
			console.error(e);
		} finally {
			loading = false;
		}
	});
</script>

<header class="head">
	<div>
		<h1 class="page-title">Visitas</h1>
		<p class="page-sub">
			Visualizações únicas de anúncios (1ª vez que cada usuário vê cada anúncio), últimos {data?.days ??
				30} dias
		</p>
	</div>
</header>

{#if loading}
	<div class="spin-wrap"><div class="spinner"></div></div>
{:else if !data}
	<div class="empty">
		<p><strong>Sem dados</strong></p>
	</div>
{:else}
	<div class="tiles">
		<div class="tile">
			<span class="tile-label">Total de visualizações</span>
			<span class="tile-value">{data.total.toLocaleString('pt-BR')}</span>
		</div>
	</div>

	<div class="table-card chart-card">
		<div class="card-head">
			<h2>Visualizações por dia</h2>
		</div>
		{#if data.daily.length === 0}
			<p class="empty-inline">Nenhuma visualização registrada no período.</p>
		{:else}
			<div class="chart" role="img" aria-label="Gráfico de visualizações por dia">
				{#each data.daily as point (point.date)}
					<div class="bar-col" title={`${formatDay(point.date)}: ${point.count}`}>
						<div class="bar" style={`height: ${(point.count / maxCount) * 100}%`}></div>
						<span class="bar-label">{formatDay(point.date)}</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="table-card">
		<div class="card-head">
			<h2>Anúncios mais visualizados</h2>
		</div>
		{#if data.top_items.length === 0}
			<p class="empty-inline">Nenhuma visualização registrada ainda.</p>
		{:else}
			<table>
				<thead>
					<tr>
						<th>Anúncio</th>
						<th class="num">Visualizações</th>
					</tr>
				</thead>
				<tbody>
					{#each data.top_items as item (item.item_id)}
						<tr>
							<td>
								<a class="name" href={`/collections/item/${item.item_id}`}>{item.title}</a>
							</td>
							<td class="num">{item.views.toLocaleString('pt-BR')}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
{/if}

<style>
	.head {
		margin-bottom: 24px;
	}
	.spin-wrap {
		display: grid;
		place-items: center;
		padding: 64px;
	}
	.tiles {
		display: flex;
		gap: 16px;
		margin-bottom: 20px;
	}
	.tile {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow-xs);
		padding: 16px 20px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 200px;
	}
	.tile-label {
		font-size: 11.5px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--faint);
	}
	.tile-value {
		font-size: 26px;
		font-weight: 650;
		letter-spacing: -0.02em;
		color: var(--ink);
	}
	.table-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
		box-shadow: var(--shadow-xs);
		margin-bottom: 20px;
	}
	.card-head {
		padding: 14px 16px;
		border-bottom: 1px solid var(--border);
		background: var(--subtle);
	}
	.card-head h2 {
		font-size: 13px;
		font-weight: 600;
		color: var(--ink);
		margin: 0;
	}
	.empty-inline {
		padding: 24px 16px;
		color: var(--muted);
		font-size: 13px;
	}
	.chart-card {
		padding-bottom: 4px;
	}
	.chart {
		display: flex;
		align-items: flex-end;
		gap: 4px;
		height: 160px;
		padding: 16px;
		overflow-x: auto;
	}
	.bar-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		height: 100%;
		min-width: 18px;
		flex: 1;
	}
	.bar {
		width: 100%;
		max-width: 18px;
		background: var(--ink);
		border-radius: 2px 2px 0 0;
		min-height: 2px;
	}
	.bar-label {
		margin-top: 6px;
		font-size: 9.5px;
		color: var(--faint);
		white-space: nowrap;
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th {
		text-align: left;
		padding: 10px 16px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--faint);
		background: var(--subtle);
		border-bottom: 1px solid var(--border);
	}
	td {
		padding: 14px 16px;
		border-bottom: 1px solid var(--border);
		vertical-align: middle;
	}
	tr:last-child td {
		border-bottom: none;
	}
	tbody tr:hover {
		background: rgba(20, 18, 16, 0.02);
	}
	.name {
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--ink);
	}
	.name:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.num {
		text-align: right;
		font-variant-numeric: tabular-nums;
		font-weight: 550;
		width: 140px;
	}
	.empty {
		border: 1px dashed var(--border-strong);
		border-radius: var(--radius);
		padding: 48px;
		text-align: center;
		color: var(--muted);
		background: var(--surface);
	}
	.empty strong {
		color: var(--ink);
		display: block;
		margin-bottom: 4px;
	}
</style>
