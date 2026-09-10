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

<div class="page-head">
	<div>
		<h1 class="page-title">Visão geral</h1>
		<p class="page-sub">Gerencie os dados da plataforma através das coleções</p>
	</div>
</div>

<div class="cards">
	{#each $collections as c (c.name)}
		<a class="card" href={`/collections/${c.name}`}>
			<div class="card-top">
				<span class="card-icon">{c.label.charAt(0).toUpperCase()}</span>
			</div>
			<div class="count">{(stats[c.name] ?? 0).toLocaleString('pt-BR')}</div>
			<div class="cname">{c.label}</div>
			<div class="card-foot">
				<span>Abrir</span>
				<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</div>
		</a>
	{/each}
</div>

<style>
	.page-head {
		margin-bottom: 24px;
	}
	.page-title {
		font-size: 22px;
		font-weight: 700;
		color: var(--text);
	}
	.page-sub {
		color: var(--text-muted);
		font-size: 13px;
		margin-top: 4px;
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 16px;
	}
	.card {
		background: var(--card-bg);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 20px;
		display: flex;
		flex-direction: column;
		box-shadow: var(--shadow-card);
		transition: box-shadow 0.16s ease, transform 0.16s ease, border-color 0.16s;
	}
	.card:hover {
		border-color: var(--accent);
		box-shadow: 0 10px 24px rgba(16, 24, 40, 0.1);
		transform: translateY(-2px);
	}
	.card-top {
		margin-bottom: 14px;
	}
	.card-icon {
		display: inline-grid;
		place-items: center;
		width: 38px;
		height: 38px;
		border-radius: 10px;
		background: var(--accent-soft);
		color: var(--accent-strong);
		font-size: 17px;
		font-weight: 700;
	}
	.count {
		font-size: 32px;
		font-weight: 700;
		color: var(--sidebar-bg);
		line-height: 1;
	}
	.cname {
		margin-top: 6px;
		font-size: 14px;
		font-weight: 500;
		color: var(--text-muted);
	}
	.card-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 18px;
		padding-top: 14px;
		border-top: 1px solid var(--border);
		font-size: 13px;
		font-weight: 600;
		color: var(--accent-strong);
	}
	.arrow {
		width: 16px;
		height: 16px;
	}
</style>
