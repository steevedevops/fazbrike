<script lang="ts">
	import { toasts } from '$lib/toast';
</script>

<div class="toasts" aria-live="polite">
	{#each $toasts as t (t.id)}
		<div class="toast {t.type}">{t.message}</div>
	{/each}
</div>

<style>
	.toasts {
		position: fixed;
		bottom: 20px;
		right: 20px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		z-index: 100;
		max-width: min(360px, calc(100vw - 40px));
	}
	.toast {
		padding: 11px 14px;
		border-radius: var(--radius-sm);
		font-size: 13px;
		font-weight: 500;
		box-shadow: var(--shadow-md);
		animation: slide 0.2s ease;
		border: 1px solid transparent;
	}
	.toast.success {
		background: var(--surface);
		color: var(--success);
		border-color: var(--border);
	}
	.toast.error {
		background: var(--surface);
		color: var(--danger);
		border-color: var(--border);
	}
	.toast.info {
		background: var(--surface);
		color: var(--ink);
		border-color: var(--border);
	}
	@keyframes slide {
		from {
			transform: translateY(8px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
</style>
