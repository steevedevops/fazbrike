<script lang="ts">
	import { onMount } from 'svelte';
	import { api, ApiError } from '$lib/api';
	import { loadModerationSummary, moderationSummary } from '$lib/moderation';
	import { toast } from '$lib/toast';
	import type { ModerationItem, ModerationReport } from '$lib/types';

	let items = $state<ModerationItem[]>([]);
	let reports = $state<ModerationReport[]>([]);
	let loading = $state(true);
	let settingSaving = $state(false);
	let busyKey = $state('');
	let reasonTarget = $state<{ kind: 'item' | 'report'; id: number; title: string } | null>(null);
	let reason = $state('');

	const reportReasons: Record<string, string> = {
		prohibited_item: 'Produto proibido ou ilegal',
		fraud: 'Suspeita de fraude',
		misleading: 'Informações enganosas',
		duplicate: 'Anúncio duplicado',
		offensive: 'Conteúdo ofensivo',
		other: 'Outro motivo'
	};

	function errorMessage(error: unknown): string {
		return error instanceof ApiError ? error.message : 'Não foi possível concluir a ação.';
	}

	function formatDate(value: string): string {
		return new Date(value).toLocaleString('pt-BR');
	}

	function formatPrice(value: number): string {
		return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
	}

	async function loadQueues() {
		loading = true;
		try {
			const [, itemQueue, reportQueue] = await Promise.all([
				loadModerationSummary(),
				api.moderationItems(),
				api.moderationReports()
			]);
			items = itemQueue.data ?? [];
			reports = reportQueue.data ?? [];
		} catch (error) {
			toast('error', errorMessage(error));
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void loadQueues();
	});

	async function toggleModeration() {
		settingSaving = true;
		try {
			const enabled = !$moderationSummary.moderation_enabled;
			const result = await api.setModerationEnabled(enabled);
			if (!enabled && result.published_pending > 0) items = [];
			await loadModerationSummary();
			toast(
				'success',
				enabled
					? 'Aprovação manual ativada. Novos anúncios entrarão em análise.'
					: 'Aprovação manual desativada. Novos anúncios serão publicados automaticamente.'
			);
		} catch (error) {
			toast('error', errorMessage(error));
		} finally {
			settingSaving = false;
		}
	}

	async function approveItem(id: number) {
		busyKey = `item-${id}`;
		try {
			await api.moderateItem(id, 'approve');
			items = items.filter((item) => item.id !== id);
			await loadModerationSummary();
			toast('success', 'Anúncio aprovado e publicado.');
		} catch (error) {
			toast('error', errorMessage(error));
		} finally {
			busyKey = '';
		}
	}

	async function dismissReport(id: number) {
		busyKey = `report-${id}`;
		try {
			await api.moderateReport(id, 'dismiss');
			reports = reports.filter((report) => report.id !== id);
			await loadModerationSummary();
			toast('success', 'Denúncia descartada.');
		} catch (error) {
			toast('error', errorMessage(error));
		} finally {
			busyKey = '';
		}
	}

	async function resolveReport(id: number) {
		busyKey = `report-${id}`;
		try {
			await api.moderateReport(id, 'resolve');
			reports = reports.filter((report) => report.id !== id);
			await loadModerationSummary();
			toast('success', 'Denúncia marcada como resolvida.');
		} catch (error) {
			toast('error', errorMessage(error));
		} finally {
			busyKey = '';
		}
	}

	function askReason(kind: 'item' | 'report', id: number, title: string) {
		reason = '';
		reasonTarget = { kind, id, title };
	}

	async function submitReason(event: SubmitEvent) {
		event.preventDefault();
		if (!reasonTarget || !reason.trim()) return;
		const target = reasonTarget;
		busyKey = `${target.kind}-${target.id}`;
		try {
			if (target.kind === 'item') {
				await api.moderateItem(target.id, 'reject', reason.trim());
				items = items.filter((item) => item.id !== target.id);
				toast('success', 'Anúncio rejeitado. O motivo ficará visível para o vendedor.');
			} else {
				await api.moderateReport(target.id, 'reject_item', reason.trim());
				reports = reports.filter((report) => report.id !== target.id);
				toast('success', 'Anúncio retirado e denúncia resolvida.');
			}
			reasonTarget = null;
			reason = '';
			await loadModerationSummary();
		} catch (error) {
			toast('error', errorMessage(error));
		} finally {
			busyKey = '';
		}
	}
</script>

<header class="head">
	<div>
		<h1 class="page-title">Moderação</h1>
		<p class="page-sub">Analise anúncios antes da publicação e trate denúncias da comunidade.</p>
	</div>
</header>

<section class="setting-card" aria-labelledby="moderation-setting">
	<div>
		<h2 id="moderation-setting">Aprovação manual de anúncios</h2>
		<p>
			{#if $moderationSummary.moderation_enabled}
				Ativada: anúncios novos ou alterados aguardam sua aprovação antes de aparecer na plataforma.
			{:else}
				Desativada: anúncios novos são publicados automaticamente.
			{/if}
		</p>
	</div>
	<button
		type="button"
		class="switch"
		class:on={$moderationSummary.moderation_enabled}
		role="switch"
		aria-checked={$moderationSummary.moderation_enabled}
		disabled={settingSaving}
		onclick={toggleModeration}
	>
		<span></span>
		{$moderationSummary.moderation_enabled ? 'Ativada' : 'Desativada'}
	</button>
</section>

<div class="tiles">
	<div class="tile">
		<span>Anúncios aguardando</span>
		<strong>{$moderationSummary.pending_items.toLocaleString('pt-BR')}</strong>
	</div>
	<div class="tile">
		<span>Denúncias abertas</span>
		<strong>{$moderationSummary.open_reports.toLocaleString('pt-BR')}</strong>
	</div>
</div>

{#if loading}
	<div class="spin-wrap"><div class="spinner"></div></div>
{:else}
	<section class="queue">
		<div class="queue-head">
			<div>
				<h2>Anúncios para análise</h2>
				<p>Mais antigos primeiro.</p>
			</div>
			<span class="queue-count">{items.length}</span>
		</div>
		{#if items.length === 0}
			<p class="empty">Nenhum anúncio aguardando aprovação.</p>
		{:else}
			<div class="cards">
				{#each items as item (item.id)}
					<article class="card">
						<div class="card-main">
							<div class="card-title-row">
								<a href={`/collections/item/${item.id}`}>{item.title}</a>
								<strong>{formatPrice(item.price)}</strong>
							</div>
							<p class="meta">Por {item.seller_name} · enviado em {formatDate(item.created_at)}</p>
							<p class="description">{item.description}</p>
						</div>
						<div class="actions">
							<a class="btn ghost" href={`/collections/item/${item.id}`}>Ver dados</a>
							<button class="btn danger" type="button" disabled={busyKey !== ''} onclick={() => askReason('item', item.id, item.title)}>Rejeitar</button>
							<button class="btn primary" type="button" disabled={busyKey !== ''} onclick={() => approveItem(item.id)}>
								{busyKey === `item-${item.id}` ? 'Processando…' : 'Aprovar'}
							</button>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</section>

	<section class="queue">
		<div class="queue-head">
			<div>
				<h2>Denúncias recebidas</h2>
				<p>Revise o conteúdo e escolha a medida adequada.</p>
			</div>
			<span class="queue-count alert">{reports.length}</span>
		</div>
		{#if reports.length === 0}
			<p class="empty">Nenhuma denúncia aberta.</p>
		{:else}
			<div class="cards">
				{#each reports as report (report.id)}
					<article class="card report-card">
						<div class="card-main">
							<div class="card-title-row">
								<a href={`/collections/item/${report.item_id}`}>{report.item_title}</a>
								<span class="reason-badge">{reportReasons[report.reason] ?? report.reason}</span>
							</div>
							<p class="meta">Denunciado por {report.reporter_name} · {formatDate(report.created_at)}</p>
							{#if report.details}<p class="description">{report.details}</p>{/if}
						</div>
						<div class="actions">
							<a class="btn ghost" href={`/collections/item/${report.item_id}`}>Ver anúncio</a>
							<button class="btn ghost" type="button" disabled={busyKey !== ''} onclick={() => dismissReport(report.id)}>Descartar</button>
							<button class="btn ghost" type="button" disabled={busyKey !== ''} onclick={() => resolveReport(report.id)}>Resolver</button>
							<button class="btn danger" type="button" disabled={busyKey !== ''} onclick={() => askReason('report', report.id, report.item_title)}>Retirar anúncio</button>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</section>
{/if}

{#if reasonTarget}
	<div class="modal-backdrop" role="presentation">
		<form class="modal" onsubmit={submitReason}>
			<h2>{reasonTarget.kind === 'item' ? 'Rejeitar anúncio' : 'Retirar anúncio denunciado'}</h2>
			<p class="modal-copy">{reasonTarget.title}</p>
			<label for="moderation-reason">Motivo</label>
			<textarea id="moderation-reason" bind:value={reason} rows="5" maxlength="1000" required placeholder="Explique claramente o que precisa ser corrigido"></textarea>
			<div class="modal-actions">
				<button class="btn ghost" type="button" disabled={busyKey !== ''} onclick={() => (reasonTarget = null)}>Cancelar</button>
				<button class="btn danger" type="submit" disabled={!reason.trim() || busyKey !== ''}>
					{busyKey ? 'Salvando…' : 'Confirmar rejeição'}
				</button>
			</div>
		</form>
	</div>
{/if}

<style>
	.head { margin-bottom: 20px; }
	.setting-card, .queue, .tile {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow-xs);
	}
	.setting-card { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 18px 20px; }
	.setting-card h2, .queue-head h2, .modal h2 { font-size: 14px; font-weight: 650; color: var(--ink); }
	.setting-card p, .queue-head p, .modal-copy { margin-top: 3px; color: var(--muted); font-size: 12.5px; }
	.switch { display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--border-strong); border-radius: 999px; background: var(--surface); color: var(--muted); padding: 5px 10px 5px 5px; font-size: 12px; font-weight: 600; }
	.switch span { width: 22px; height: 22px; border-radius: 50%; background: var(--faint); }
	.switch.on { color: var(--ink); border-color: var(--ink); }
	.switch.on span { background: var(--ink); }
	.tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin: 16px 0 20px; }
	.tile { padding: 15px 18px; display: flex; align-items: center; justify-content: space-between; }
	.tile span { color: var(--muted); font-size: 12px; }
	.tile strong { font-size: 22px; color: var(--ink); }
	.queue { overflow: hidden; margin-bottom: 20px; }
	.queue-head { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: var(--subtle); border-bottom: 1px solid var(--border); }
	.queue-count { min-width: 24px; height: 24px; display: grid; place-items: center; border-radius: 999px; background: var(--ink); color: #fff; font-size: 11px; font-weight: 700; }
	.queue-count.alert { background: var(--danger); }
	.cards { display: flex; flex-direction: column; }
	.card { display: flex; align-items: center; gap: 20px; justify-content: space-between; padding: 16px; border-bottom: 1px solid var(--border); }
	.card:last-child { border-bottom: none; }
	.card-main { min-width: 0; flex: 1; }
	.card-title-row { display: flex; align-items: center; gap: 12px; justify-content: space-between; }
	.card-title-row a { font-weight: 650; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.card-title-row a:hover { text-decoration: underline; }
	.card-title-row strong { font-size: 13px; white-space: nowrap; }
	.meta { margin-top: 4px; color: var(--faint); font-size: 11.5px; }
	.description { margin-top: 8px; color: var(--muted); font-size: 12.5px; line-height: 1.45; display: -webkit-box; line-clamp: 2; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
	.actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 5px; flex-shrink: 0; }
	.actions .btn { font-size: 12px; padding: 6px 9px; }
	.reason-badge { color: var(--danger); background: var(--danger-soft); padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; white-space: nowrap; }
	.empty { padding: 28px 16px; color: var(--muted); text-align: center; font-size: 13px; }
	.spin-wrap { display: grid; place-items: center; padding: 64px; }
	.modal-backdrop { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; padding: 20px; background: rgba(20, 18, 16, 0.48); }
	.modal { width: min(520px, 100%); background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow-md); padding: 22px; }
	.modal label { display: block; margin: 18px 0 6px; font-size: 12.5px; font-weight: 600; }
	.modal textarea { width: 100%; resize: vertical; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); padding: 10px 12px; outline: none; }
	.modal textarea:focus { border-color: var(--ink); box-shadow: 0 0 0 3px var(--accent-soft); }
	.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
	@media (max-width: 760px) {
		.setting-card, .card { align-items: stretch; flex-direction: column; }
		.tiles { grid-template-columns: 1fr; }
		.actions { justify-content: flex-start; }
	}
</style>
