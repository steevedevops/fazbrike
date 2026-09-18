<script lang="ts">
	import { login, currentUser, authLoading } from '$lib/auth';
	import { goto } from '$app/navigation';
	import { toast } from '$lib/toast';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let navigated = false;

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

<div class="wrap">
	<aside class="hero" aria-hidden="true">
		<div class="hero-inner">
			<span class="mark">F</span>
			<p class="hero-title">Fazbrike</p>
			<p class="hero-sub">Controle os dados da plataforma com calma e precisão.</p>
		</div>
		<div class="grain"></div>
	</aside>

	<main class="panel">
		<form class="form" onsubmit={submit}>
			<div class="head">
				<h1>Entrar</h1>
				<p>Use uma conta com papel de administrador</p>
			</div>

			<label>
				<span>Email</span>
				<input type="email" bind:value={email} required autocomplete="username" placeholder="voce@exemplo.com" />
			</label>

			<label>
				<span>Senha</span>
				<input type="password" bind:value={password} required autocomplete="current-password" placeholder="••••••••" />
			</label>

			{#if error}<div class="error" role="alert">{error}</div>{/if}

			<button class="btn primary" type="submit" disabled={$authLoading}>
				{$authLoading ? 'Entrando…' : 'Continuar'}
			</button>
		</form>
	</main>
</div>

<style>
	.wrap {
		min-height: 100vh;
		display: grid;
		grid-template-columns: 1.05fr 1fr;
	}

	.hero {
		position: relative;
		background: var(--ink);
		color: #fff;
		display: grid;
		place-items: center;
		padding: 48px;
		overflow: hidden;
	}
	.hero-inner {
		position: relative;
		z-index: 1;
		max-width: 320px;
	}
	.mark {
		display: inline-grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border-radius: 10px;
		background: #fff;
		color: var(--ink);
		font-weight: 700;
		font-size: 16px;
		letter-spacing: -0.04em;
		margin-bottom: 28px;
	}
	.hero-title {
		font-size: 36px;
		font-weight: 600;
		letter-spacing: -0.04em;
		line-height: 1.1;
		margin-bottom: 12px;
	}
	.hero-sub {
		font-size: 15px;
		line-height: 1.55;
		color: rgba(255, 255, 255, 0.55);
		font-weight: 400;
	}
	.grain {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse 80% 50% at 20% 20%, rgba(196, 92, 38, 0.22), transparent 55%),
			radial-gradient(ellipse 60% 40% at 90% 80%, rgba(255, 255, 255, 0.06), transparent 50%);
		pointer-events: none;
	}

	.panel {
		display: grid;
		place-items: center;
		padding: 32px 24px;
		background: var(--canvas);
	}
	.form {
		width: 100%;
		max-width: 340px;
		display: flex;
		flex-direction: column;
	}
	.head {
		margin-bottom: 28px;
	}
	.head h1 {
		font-size: 24px;
		font-weight: 600;
		letter-spacing: -0.03em;
		margin-bottom: 6px;
	}
	.head p {
		color: var(--muted);
		font-size: 13.5px;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-bottom: 14px;
		font-size: 12.5px;
		font-weight: 550;
		color: var(--ink);
	}
	input {
		padding: 10px 12px;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		background: var(--surface);
		outline: none;
		font-size: 14px;
		transition: border-color 0.12s, box-shadow 0.12s;
	}
	input:focus {
		border-color: var(--ink);
		box-shadow: 0 0 0 3px var(--accent-soft);
	}
	.error {
		background: var(--danger-soft);
		color: var(--danger);
		padding: 9px 11px;
		border-radius: var(--radius-sm);
		font-size: 13px;
		margin-bottom: 10px;
	}
	.btn {
		width: 100%;
		margin-top: 8px;
		padding: 11px;
		font-size: 14px;
	}

	@media (max-width: 820px) {
		.wrap {
			grid-template-columns: 1fr;
		}
		.hero {
			min-height: 180px;
			padding: 32px 24px;
			place-items: start center;
		}
		.hero-title {
			font-size: 28px;
		}
		.hero-sub {
			display: none;
		}
	}
</style>
