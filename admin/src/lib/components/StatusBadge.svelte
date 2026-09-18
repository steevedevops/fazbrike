<script lang="ts">
	import type { EnumOption } from '$lib/enums';

	let { option }: { option: EnumOption } = $props();

	const paths: Record<string, string> = {
		check: 'M3.5 8.5l3 3 6-6.5',
		clock: 'M8 4.5V8l2.25 1.75M14 8A6 6 0 112 8a6 6 0 0112 0z',
		x: 'M4.5 4.5l7 7m0-7l-7 7',
		pause: 'M6 4v8M10 4v8',
		tag: 'M8.5 2.5H13V7l-6 6-4.5-4.5 6-6zM11 5h.01',
		archive: 'M2.5 5.5h11M3.5 5.5V13h9V5.5M2.5 3h11v2.5h-11zM6.5 8.5h3',
		star: 'M8 2.5l1.7 3.5 3.8.5-2.8 2.6.7 3.8L8 11.1l-3.4 1.8.7-3.8L2.5 6.5l3.8-.5L8 2.5z',
		user: 'M13 13.5c0-2.5-2.2-4-5-4s-5 1.5-5 4M8 7.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
		shield: 'M8 2l5 2v4c0 3-2.2 5.2-5 6-2.8-.8-5-3-5-6V4l5-2z',
		car: 'M3 10.5a1 1 0 11-2 0 1 1 0 012 0zm12 0a1 1 0 11-2 0 1 1 0 012 0zM2.5 10.5H2V7l1.5-3h7L13 7h1v3.5h-1M5 5.5h4',
		home: 'M2.5 7L8 2.5 13.5 7v6.5h-3.5v-3.5h-4v3.5H2.5z',
		box: 'M2.5 5L8 2.5 13.5 5v6L8 13.5 2.5 11V5zm0 0L8 7.5m0 0L13.5 5M8 7.5v6'
	};
</script>

<span class="badge tone-{option.tone}" title={option.label}>
	<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
		<path
			d={paths[option.icon] ?? paths.tag}
			stroke="currentColor"
			stroke-width="1.4"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
	{option.label}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 3px 9px 3px 7px;
		border-radius: 999px;
		font-size: 12px;
		font-weight: 600;
		line-height: 1.5;
		border: 1px solid transparent;
		white-space: nowrap;
	}
	.badge svg {
		width: 12px;
		height: 12px;
		flex-shrink: 0;
	}
	.tone-success {
		color: var(--success);
		background: var(--success-soft);
		border-color: rgba(63, 125, 78, 0.22);
	}
	.tone-warn {
		color: var(--warn);
		background: var(--warn-soft);
		border-color: var(--warn-border);
	}
	.tone-danger {
		color: var(--danger);
		background: var(--danger-soft);
		border-color: rgba(180, 35, 24, 0.22);
	}
	.tone-neutral {
		color: var(--ink);
		background: var(--accent-soft);
		border-color: var(--border);
	}
	.tone-muted {
		color: var(--muted);
		background: var(--subtle);
		border-color: var(--border);
	}
</style>
