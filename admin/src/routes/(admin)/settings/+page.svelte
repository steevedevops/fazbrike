<script lang="ts">
	import { currentUser, logout, getActiveToken } from '$lib/auth';
	import { goto } from '$app/navigation';
	import { toast } from '$lib/toast';

	let copied = $state(false);

	function logoutClick() {
		logout();
		goto('/login');
	}

	const session = $derived(getActiveToken());

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
			<p class="page-sub">Gerencie sua conta e a sessão de administrador</p>
		</div>
	</div>

	<div class="grid">
		<!-- Conta -->
		<div class="card">
			<h2>Conta do administrador</h2>
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
				<span class="v"><span class="badge admin">Administrador</span></span>
			</div>
			<div class="card-actions">
				<button class="btn primary" onclick={logoutClick}>Sair da conta</button>
			</div>
		</div>

		<!-- Sessão / Token ativo -->
		<div class="card">
			<h2>Token de sessão ativo</h2>

			{#if session}
				<div class="token-box">
					<code class="token-text" title={session.token}>
						{session.token.slice(0, 40)}…{session.token.slice(-12)}
					</code>
					<button class="btn ghost" onclick={copyToken}>
						{copied ? '✓ Copiado' : 'Copiar'}
					</button>
				</div>

				<div class="row">
					<span class="k">Usuário (id)</span>
					<span class="v">#{session.payload.user_id ?? '—'}</span>
				</div>
				<div class="row">
					<span class="k">Papel</span>
					<span class="v"><span class="badge">{String(session.payload.role ?? '—')}</span></span>
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
		<h2>Como adicionar um novo módulo</h2>
		<p>
			Toda collection exibida aqui vem automaticamente dos models do backend (estilo Django).
			Ao criar um novo model em <code>backend/models</code>, registre-o em
			<code>initAdminRegistry()</code> no <code>main.go</code> — o CRUD completo desta coleção
			aparece aqui sem novos esforços.
		</p>
	</div>
</div>

<style>
	.page {
		max-width: 860px;
	}
	.page-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 22px;
	}
	.page-title {
		font-size: 22px;
		font-weight: 700;
		color: var(--text);
		margin: 0;
	}
	.page-sub {
		color: var(--text-muted);
		font-size: 13px;
		margin-top: 4px;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 16px;
		margin-bottom: 16px;
	}
	.card {
		background: var(--card-bg);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 22px;
		box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
	}
	.card h2 {
		font-size: 15px;
		font-weight: 600;
		margin: 0 0 16px;
		color: var(--text);
	}
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 9px 0;
		border-bottom: 1px solid var(--border);
	}
	.k {
		color: var(--text-muted);
		font-size: 13px;
	}
	.v {
		font-weight: 500;
		font-size: 13px;
		text-align: right;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.badge {
		background: var(--accent-soft);
		color: var(--accent-strong);
		padding: 2px 10px;
		border-radius: 999px;
		font-size: 12px;
		font-weight: 700;
	}
	.badge.admin {
		background: var(--sidebar-bg);
		color: #fff;
	}
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		color: #b45309;
		background: rgba(245, 158, 11, 0.12);
		padding: 2px 10px;
		border-radius: 999px;
		font-weight: 600;
	}
	.pill.ok {
		color: var(--accent-strong);
		background: var(--accent-soft);
	}
	.card-actions {
		margin-top: 18px;
		display: flex;
		justify-content: flex-end;
	}
	.token-box {
		display: flex;
		align-items: center;
		gap: 8px;
		background: #f6f7f9;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 8px 10px;
		margin-bottom: 14px;
	}
	.token-text {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 11px;
		color: #4b5563;
	}
	.btn {
		padding: 8px 15px;
		border-radius: var(--radius-sm);
		font-weight: 600;
		font-size: 13px;
		border: 1px solid transparent;
	}
	.btn.primary {
		background: var(--accent-strong);
		color: #fff;
	}
	.btn.primary:hover {
		background: #1d9c6e;
	}
	.btn.ghost {
		background: #fff;
		border-color: var(--border-strong);
		color: var(--text);
		font-size: 12px;
		padding: 6px 11px;
	}
	.btn.ghost:hover {
		background: #f5f5f5;
	}
	.muted {
		color: var(--text-muted);
		font-size: 13px;
	}
	.hint p {
		color: var(--text-muted);
		font-size: 13px;
		line-height: 1.6;
	}
	code {
		background: #f3f4f6;
		padding: 1px 5px;
		border-radius: 4px;
		font-size: 12px;
	}
</style>
