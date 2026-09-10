<script lang="ts">
	import { toasts } from '$lib/toast';
</script>

<div class="toasts">
	{#each $toasts as t (t.id)}
		<div class="toast {t.type}">{t.message}</div>
	{/each}
</div>

<style>
	.toasts {
		position: fixed;
		top: 16px;
		right: 16px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		z-index: 100;
	}
	.toast {
		padding: 10px 16px;
		border-radius: 6px;
		color: #fff;
		font-size: 13px;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
		animation: slide 0.2s ease;
		min-width: 220px;
	}
	.toast.success {
		background: var(--accent-strong);
	}
	.toast.error {
		background: var(--danger);
	}
	.toast.info {
		background: #3a3f4b;
	}
	@keyframes slide {
		from {
			transform: translateY(-8px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
</style>
