<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api';
	import { collections } from '$lib/meta';
	import { toast } from '$lib/toast';
	import { buildSections } from '$lib/nav';
	import Icon from '$lib/components/Icon.svelte';

	let stats = $state<Record<string, number>>({});
	let loading = $state(true);

	const sections = $derived(buildSections($collections));
	const totalRecords = $derived(
		Object.values(stats).reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0)
	);

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
		<p class="page-sub">Coleções agrupadas por área da plataforma</p>
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
	<div class="kpis">
		<div class="kpi">
			<span>Coleções</span>
			<strong>{$collections.length.toLocaleString('pt-BR')}</strong>
		</div>
		<div class="kpi">
			<span>Registros</span>
			<strong>{totalRecords.toLocaleString('pt-BR')}</strong>
		</div>
		<div class="kpi">
			<span>Áreas</span>
			<strong>{sections.length.toLocaleString('pt-BR')}</strong>
		</div>
	</div>

	{#each sections as section (section.id)}
		<section class="block">
			<div class="block-head">
				<span class="block-icon"><Icon name={section.icon} size={16} /></span>
				<div>
					<h2>{section.label}</h2>
					<p>{section.blurb}</p>
				</div>
			</div>
			<div class="cards">
				{#each section.items as item (item.id)}
					<a class="card" href={item.href}>
						<span class="card-icon"><Icon name={item.icon} size={16} /></span>
						<span class="card-copy">
							<span class="card-label">{item.label}</span>
							{#if item.collection}
								<span class="card-slug">{item.collection}</span>
							{:else}
								<span class="card-slug">atalho</span>
							{/if}
						</span>
						{#if item.collection}
							<strong class="card-count">{(stats[item.collection] ?? 0).toLocaleString('pt-BR')}</strong>
						{:else}
							<span class="card-go">Abrir</span>
						{/if}
					</a>
				{/each}
			</div>
		</section>
	{/each}
{/if}

<style>
	.head {
		margin-bottom: 22px;
	}
	.spin-wrap {
		display: grid;
		place-items: center;
		padding: 64px;
	}
	.kpis {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 180px));
		gap: 12px;
		margin-bottom: 28px;
	}
	.kpi {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow-xs);
		padding: 14px 16px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.kpi span {
		font-size: 12px;
		color: var(--muted);
		font-weight: 500;
	}
	.kpi strong {
		font-size: 22px;
		letter-spacing: -0.03em;
		font-variant-numeric: tabular-nums;
	}
	.block {
		margin-bottom: 26px;
	}
	.block-head {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 12px;
	}
	.block-icon {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		display: grid;
		place-items: center;
		background: var(--ink);
		color: #fff;
		flex-shrink: 0;
	}
	.block-head h2 {
		font-size: 15px;
		font-weight: 650;
		letter-spacing: -0.02em;
	}
	.block-head p {
		font-size: 12.5px;
		color: var(--muted);
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 10px;
	}
	.card {
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 72px;
		padding: 12px 14px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow-xs);
		transition: border-color 0.12s, box-shadow 0.12s;
	}
	.card:hover {
		border-color: var(--border-strong);
		box-shadow: var(--shadow-sm);
	}
	.card-icon {
		width: 34px;
		height: 34px;
		border-radius: 8px;
		display: grid;
		place-items: center;
		background: var(--subtle);
		border: 1px solid var(--border);
		color: var(--ink);
		flex-shrink: 0;
	}
	.card-copy {
		min-width: 0;
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	.card-label {
		font-weight: 600;
		letter-spacing: -0.02em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.card-slug {
		font-size: 11.5px;
		color: var(--faint);
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	}
	.card-count {
		font-variant-numeric: tabular-nums;
		font-size: 16px;
		letter-spacing: -0.03em;
	}
	.card-go {
		font-size: 12.5px;
		font-weight: 600;
		color: var(--muted);
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

	@media (max-width: 720px) {
		.kpis {
			grid-template-columns: 1fr;
		}
	}
</style>
