<script lang="ts">
	import { login, currentUser, authLoading } from '$lib/auth';
	import { goto } from '$app/navigation';
	import { toast } from '$lib/toast';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let navigated = false;

	// Se já logado, vai ao dashboard (com guard anti-loop).
	$effect(() => {
		if (navigated) return;
		if (!$currentUser) return;
		if (typeof window !== 'undefined') {
			navigated = true;
			goto('/', { replaceState: true });
		}
	});

	async function submit(e: Event) {
		e.preventDefault();
		error = '';
		try {
			const user = await login(email, password);
			if (user.role !== 'admin') {
				toast('error', 'Acesso restrito: sua conta não é de administrador.');
				return;
			}
			toast('success', 'Bem-vindo, ' + user.name + '!');
			goto('/');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Falha no login';
			toast('error', error);
		}
	}
</script>

<div class="login-wrap">
	<form class="card" onsubmit={submit}>
		<img src="/favicon.svg" alt="" width="48" height="48" />
		<h1>Fazbrike Admin</h1>
		<p class="sub">Painel de administração</p>

		<label>
			<span>Email</span>
			<input type="email" bind:value={email} required autocomplete="username" placeholder="admin@exemplo.com" />
		</label>

		<label>
			<span>Senha</span>
			<input
				type="password"
				bind:value={password}
				required
				autocomplete="current-password"
				placeholder="••••••••"
			/>
		</label>

		{#if error}<div class="error">{error}</div>{/if}

		<button class="btn" type="submit" disabled={$authLoading}>
			{$authLoading ? 'Entrando…' : 'Entrar'}
		</button>
	</form>
</div>

<style>
	.login-wrap {
		min-height: 100vh;
		display: grid;
		place-items: center;
		background: var(--sidebar-bg);
		padding: 20px;
	}
	.card {
		width: 360px;
		max-width: 94vw;
		background: #fff;
		border-radius: 12px;
		padding: 36px 32px;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
	}
	h1 {
		font-size: 22px;
		margin: 14px 0 2px;
	}
	.sub {
		color: var(--text-muted);
		font-size: 13px;
		margin-bottom: 22px;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		width: 100%;
		margin-bottom: 14px;
		text-align: left;
		font-size: 13px;
		font-weight: 600;
	}
	input {
		padding: 9px 12px;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		font-size: 14px;
		outline: none;
	}
	input:focus {
		border-color: var(--accent-strong);
		box-shadow: 0 0 0 2px var(--accent-soft);
	}
	.error {
		width: 100%;
		background: var(--danger-soft);
		color: var(--danger);
		padding: 8px 12px;
		border-radius: var(--radius-sm);
		font-size: 13px;
		margin-bottom: 10px;
	}
	.btn {
		width: 100%;
		padding: 10px;
		background: var(--accent-strong);
		color: #fff;
		border: none;
		border-radius: var(--radius-sm);
		font-weight: 700;
		font-size: 14px;
		margin-top: 6px;
	}
	.btn:hover {
		background: #1d9c6e;
	}
	.btn:disabled {
		opacity: 0.6;
	}
</style>
