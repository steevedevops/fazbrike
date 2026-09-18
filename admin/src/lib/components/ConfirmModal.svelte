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
			aria-labelledby="confirm-title"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.key === 'Escape' && onCancel()}
		>
			<h3 id="confirm-title">{title}</h3>
			<p>{message}</p>
			<div class="actions">
				<button class="btn ghost" type="button" onclick={onCancel} disabled={busy}>Cancelar</button>
				<button class="btn danger" type="button" onclick={onConfirm} disabled={busy}>
					{busy ? 'Excluindo…' : 'Excluir'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(28, 25, 23, 0.35);
		display: grid;
		place-items: center;
		z-index: 50;
		animation: fade 0.15s ease-out;
		backdrop-filter: blur(2px);
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	.modal {
		width: 400px;
		max-width: 92vw;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 24px;
		box-shadow: var(--shadow-md);
		animation: pop 0.18s ease-out;
	}
	@keyframes pop {
		from {
			opacity: 0;
			transform: translateY(8px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
	h3 {
		margin: 0 0 8px;
		font-size: 16px;
		font-weight: 650;
		letter-spacing: -0.01em;
	}
	p {
		color: var(--muted);
		font-size: 13px;
		margin: 0 0 22px;
		line-height: 1.5;
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}
</style>
