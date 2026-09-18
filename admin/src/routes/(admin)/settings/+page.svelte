<script lang="ts">
	import { currentUser, logout, getActiveToken } from '$lib/auth';
	import { goto } from '$app/navigation';
	import { toast } from '$lib/toast';
	import { getEnumOption } from '$lib/enums';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	let copied = $state(false);

	function logoutClick() {
		logout();
		goto('/login');
	}

	const session = $derived(getActiveToken());
	const accountRole = $derived(getEnumOption('user', 'role', $currentUser?.role));
	const sessionRole = $derived(getEnumOption('user', 'role', session?.payload.role));

	function status(exp?: number): string {
		if (!exp) return 'indeterminado';
		const now = Math.floor(Date.now() / 1000);
		const diff = exp - now;
		if (diff <= 0) return 'expirado';
		const mins = Math.floor(diff / 60);
		if (mins < 60) return `${mins} min restantes`;
		const h = Math.floor(mins / 60);
		const m = mins % 60;
		return `${h}h ${m}m`;
	}

	function expLabel(exp?: number): string {
		if (!exp) return '—';
		return new Date(exp * 1000).toLocaleString('pt-BR');
	}

	async function copyToken() {
		if (!session) return;
		try {
			await navigator.clipboard.writeText(session.token);
			copied = true;
			toast('success', 'Token copiado para a área de transferência.');
			setTimeout(() => (copied = false), 2000);
		} catch {
			toast('error', 'Não foi possível copiar o token.');
		}
	}
</script>

<div class="page">
	<div class="page-head">
		<div>
			<h1 class="page-title">Configurações</h1>
			<p class="page-sub">Conta e sessão de administrador</p>
		</div>
	</div>

	<div class="grid">
		<div class="card">
			<h2>Conta</h2>
			<div class="row">
				<span class="k">Nome</span>
				<span class="v">{$currentUser?.name ?? '—'}</span>
			</div>
			<div class="row">
				<span class="k">Email</span>
				<span class="v">{$currentUser?.email ?? '—'}</span>
			</div>
			<div class="row">
				<span class="k">Papel</span>
				<span class="v">
					{#if accountRole}<StatusBadge option={accountRole} />{:else}—{/if}
				</span>
			</div>
			<div class="card-actions">
				<button class="btn ghost" type="button" onclick={logoutClick}>Sair da conta</button>
			</div>
		</div>

		<div class="card">
			<h2>Sessão</h2>

			{#if session}
				<div class="token-box">
					<code class="token-text" title={session.token}>
						{session.token.slice(0, 36)}…{session.token.slice(-10)}
					</code>
					<button class="btn ghost" type="button" onclick={copyToken}>
						{copied ? 'Copiado' : 'Copiar'}
					</button>
				</div>

				<div class="row">
					<span class="k">Usuário</span>
					<span class="v">#{session.payload.user_id ?? '—'}</span>
				</div>
				<div class="row">
					<span class="k">Papel</span>
					<span class="v">
						{#if sessionRole}<StatusBadge option={sessionRole} />{:else}—{/if}
					</span>
				</div>
				<div class="row">
					<span class="k">Expira em</span>
					<span class="v">{expLabel(session.payload.exp)}</span>
				</div>
				<div class="row">
					<span class="k">Status</span>
					<span class="v">
						<span class="pill" class:ok={session.payload.exp == null || session.payload.exp * 1000 > Date.now()}>
							{status(session.payload.exp)}
						</span>
					</span>
				</div>
			{:else}
				<p class="muted">Nenhum token ativo nesta sessão.</p>
			{/if}
		</div>
	</div>

	<div class="card hint">
		<h2>Novo módulo</h2>
		<p>
			Collections vêm dos models do backend. Ao criar um model em <code>backend/models</code>, registre-o em
			<code>initAdminRegistry()</code> no <code>main.go</code> — o CRUD aparece automaticamente.
		</p>
	</div>
</div>

<style>
	.page {
		max-width: 800px;
		width: 100%;
		margin: 0 auto;
	}
	.page-head {
		margin-bottom: 24px;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 12px;
		margin-bottom: 12px;
	}
	.card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 20px;
		box-shadow: var(--shadow-xs);
	}
	.card h2 {
		font-size: 13px;
		font-weight: 650;
		margin: 0 0 14px;
		color: var(--ink);
		letter-spacing: -0.01em;
	}
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 0;
		border-bottom: 1px solid var(--border);
	}
	.row:last-of-type {
		border-bottom: none;
	}
	.k {
		color: var(--muted);
		font-size: 13px;
	}
	.v {
		font-weight: 500;
		font-size: 13px;
		text-align: right;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.pill {
		display: inline-flex;
		font-size: 12px;
		color: var(--warn);
		background: var(--warn-soft);
		padding: 2px 10px;
		border-radius: 999px;
		font-weight: 600;
	}
	.pill.ok {
		color: var(--success);
		background: var(--success-soft);
	}
	.card-actions {
		margin-top: 16px;
		display: flex;
		justify-content: flex-end;
	}
	.token-box {
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--subtle);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 8px 10px;
		margin-bottom: 12px;
	}
	.token-text {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 11px;
		color: var(--muted);
	}
	.muted {
		color: var(--muted);
		font-size: 13px;
	}
	.hint p {
		color: var(--muted);
		font-size: 13px;
		line-height: 1.6;
	}
	code {
		background: var(--subtle);
		padding: 1px 5px;
		border-radius: 4px;
		font-size: 12px;
		border: 1px solid var(--border);
	}
</style>
