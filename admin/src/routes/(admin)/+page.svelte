<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api';
	import { collections } from '$lib/meta';
	import { toast } from '$lib/toast';

	let stats = $state<Record<string, number>>({});
	let loading = $state(true);

	onMount(async () => {
		try {
			stats = await api.stats();
		} catch (e) {
			toast('error', 'Não foi possível carregar as estatísticas.');
			console.error(e);
		} finally {
			loading = false;
		}
	});
</script>

<header class="head">
	<div>
		<h1 class="page-title">Visão geral</h1>
		<p class="page-sub">Coleções e volume de registros</p>
	</div>
</header>

{#if loading}
	<div class="spin-wrap"><div class="spinner"></div></div>
{:else if $collections.length === 0}
	<div class="empty">
		<p><strong>Nenhuma coleção</strong></p>
		<p>Registre models no backend para aparecerem aqui.</p>
	</div>
{:else}
	<div class="table-card">
		<table>
			<thead>
				<tr>
					<th>Coleção</th>
					<th class="num">Registros</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each $collections as c (c.name)}
					<tr>
						<td>
							<a class="name" href={`/collections/${c.name}`}>{c.label}</a>
							<span class="slug">{c.name}</span>
						</td>
						<td class="num">{(stats[c.name] ?? 0).toLocaleString('pt-BR')}</td>
						<td class="go">
							<a href={`/collections/${c.name}`}>Abrir</a>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
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
	.table-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
		box-shadow: var(--shadow-xs);
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
		display: block;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--ink);
	}
	.name:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.slug {
		display: block;
		font-size: 11.5px;
		color: var(--faint);
		margin-top: 2px;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	}
	.num {
		text-align: right;
		font-variant-numeric: tabular-nums;
		font-weight: 550;
		width: 120px;
	}
	.go {
		text-align: right;
		width: 80px;
	}
	.go a {
		font-size: 12.5px;
		font-weight: 550;
		color: var(--muted);
		padding: 4px 8px;
		border-radius: var(--radius-xs);
	}
	.go a:hover {
		background: var(--subtle);
		color: var(--ink);
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
