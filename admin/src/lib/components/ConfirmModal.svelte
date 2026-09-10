<script lang="ts">
	interface Props {
		open: boolean;
		title?: string;
		message?: string;
		busy?: boolean;
		onConfirm: () => void;
		onCancel: () => void;
	}
	let {
		open,
		title = 'Confirmar exclusão',
		message = 'Tem certeza que deseja excluir este registro?',
		busy = false,
		onConfirm,
		onCancel
	}: Props = $props();
</script>

{#if open}
	<div class="overlay" role="presentation" onclick={onCancel} onkeydown={(e) => e.key === 'Escape' && onCancel()}>
		<div
			class="modal"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.key === 'Escape' && onCancel()}
		>
			<div class="icon">⚠</div>
			<h3>{title}</h3>
			<p>{message}</p>
			<div class="actions">
				<button class="btn ghost" onclick={onCancel} disabled={busy}>Cancelar</button>
				<button class="btn danger" onclick={onConfirm} disabled={busy}>
					{busy ? 'Excluindo…' : 'Confirmar'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		display: grid;
		place-items: center;
		z-index: 50;
	}
	.modal {
		width: 380px;
		max-width: 92vw;
		background: #fff;
		border-radius: 10px;
		padding: 24px;
		text-align: center;
	}
	.icon {
		font-size: 34px;
	}
	h3 {
		margin: 12px 0 6px;
		font-size: 18px;
	}
	p {
		color: var(--text-muted);
		font-size: 13px;
		margin-bottom: 20px;
	}
	.actions {
		display: flex;
		justify-content: center;
		gap: 10px;
	}
	.btn {
		padding: 8px 18px;
		border-radius: var(--radius-sm);
		font-weight: 600;
		font-size: 13px;
		border: 1px solid transparent;
	}
	.btn.ghost {
		background: #fff;
		border-color: var(--border-strong);
		color: var(--text);
	}
	.btn.danger {
		background: var(--danger);
		color: #fff;
	}
	.btn:disabled {
		opacity: 0.6;
	}
</style>
