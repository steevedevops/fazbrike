<script lang="ts">
	import { api } from '$lib/api';

	interface Option {
		id: number;
		label: string;
	}

	interface Props {
		id: string;
		collectionName: string;
		labelField: string;
		value: number | string | null | undefined;
		initialLabel?: string;
		required?: boolean;
		excludeId?: number | string | null;
		onChange: (value: number | null) => void;
	}
	let {
		id,
		collectionName,
		labelField,
		value,
		initialLabel = '',
		required = false,
		excludeId = null,
		onChange
	}: Props = $props();

	let open = $state(false);
	let loading = $state(false);
	let query = $state('');
	let options = $state<Option[]>([]);
	let displayLabel = $state(initialLabel);
	let containerEl: HTMLDivElement | undefined;
	let timer: ReturnType<typeof setTimeout> | undefined;

	// Se o registro carregado mudar (ex.: trocou de tela), realinha o rótulo
	// exibido com o valor vindo do servidor.
	$effect(() => {
		displayLabel = initialLabel;
	});

	function search(q: string) {
		clearTimeout(timer);
		timer = setTimeout(async () => {
			loading = true;
			try {
				// perPage baixo + "fields" restrito ao id/rótulo: a busca roda a
				// cada tecla, então mantemos a query e o payload pequenos.
				const res = await api.list(collectionName, {
					search: q,
					perPage: 20,
					fields: `id,${labelField}`
				});
				options = (res.data as Record<string, unknown>[])
					.filter((r) => excludeId === null || String(r.id) !== String(excludeId))
					.map((r) => ({ id: Number(r.id), label: String(r[labelField] ?? `#${r.id}`) }));
			} catch {
				options = [];
			} finally {
				loading = false;
			}
		}, 250);
	}

	function onFocus() {
		open = true;
		query = displayLabel;
		search(query);
	}

	function onInput(e: Event) {
		query = (e.currentTarget as HTMLInputElement).value;
		search(query);
	}

	function pick(opt: Option) {
		displayLabel = opt.label;
		query = '';
		open = false;
		onChange(opt.id);
	}

	function clear(e: MouseEvent) {
		e.stopPropagation();
		displayLabel = '';
		open = false;
		onChange(null);
	}

	function onDocClick(e: MouseEvent) {
		if (containerEl && !containerEl.contains(e.target as Node)) open = false;
	}
</script>

<svelte:window onclick={onDocClick} />

<div class="relation-select" bind:this={containerEl}>
	<div class="rs-input-row">
		<input
			{id}
			type="text"
			placeholder="Buscar…"
			value={open ? query : displayLabel}
			onfocus={onFocus}
			oninput={onInput}
			{required}
			autocomplete="off"
		/>
		{#if !required && (value !== null && value !== undefined && value !== '')}
			<button type="button" class="rs-clear" onclick={clear} title="Desvincular" aria-label="Desvincular">×</button>
		{/if}
	</div>
	{#if open}
		<div class="rs-dropdown">
			{#if loading}
				<div class="rs-empty">Buscando…</div>
			{:else if options.length === 0}
				<div class="rs-empty">Nenhum resultado</div>
			{:else}
				{#each options as opt (opt.id)}
					<button
						type="button"
						class="rs-opt"
						class:active={String(opt.id) === String(value)}
						onclick={() => pick(opt)}
					>
						{opt.label}
					</button>
				{/each}
			{/if}
		</div>
	{/if}
</div>

<style>
	.relation-select {
		position: relative;
	}
	.rs-input-row {
		position: relative;
	}
	.rs-input-row input {
		width: 100%;
		padding-right: 28px;
	}
	.rs-clear {
		position: absolute;
		right: 6px;
		top: 50%;
		transform: translateY(-50%);
		border: none;
		background: none;
		color: var(--muted);
		font-size: 16px;
		line-height: 1;
		padding: 4px 6px;
		border-radius: var(--radius-xs);
	}
	.rs-clear:hover {
		color: var(--danger);
		background: var(--danger-soft);
	}
	.rs-dropdown {
		position: absolute;
		z-index: 20;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		max-height: 240px;
		overflow: auto;
		background: var(--surface);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-md, 0 6px 20px rgba(0, 0, 0, 0.12));
		padding: 4px;
	}
	.rs-opt {
		display: block;
		width: 100%;
		text-align: left;
		padding: 8px 10px;
		border: none;
		background: none;
		border-radius: var(--radius-xs);
		font-size: 13px;
		color: var(--ink);
	}
	.rs-opt:hover,
	.rs-opt.active {
		background: var(--subtle);
	}
	.rs-empty {
		padding: 10px;
		font-size: 12px;
		color: var(--muted);
		text-align: center;
	}
</style>
