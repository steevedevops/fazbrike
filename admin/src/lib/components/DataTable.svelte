<script lang="ts">
	import type { CollectionMeta, FieldMeta } from '$lib/types';
	import type { Snippet } from 'svelte';

	interface Props {
		collection: CollectionMeta;
		records: Record<string, unknown>[];
		visibleFields: FieldMeta[];
		sort?: { field: string; desc: boolean } | null;
		onSort?: (field: string) => void;
		onEdit?: (id: number) => void;
		onDelete?: (id: number) => void;
		/** Ações extras renderizadas por linha (recebem o registro), antes de Editar/Excluir. */
		rowActions?: Snippet<[Record<string, unknown>]>;
		/** Conteúdo filho (usado para declarar snippets nomeados). */
		children?: Snippet;
	}
	let {
		collection,
		records,
		visibleFields,
		sort = null,
		onSort = () => {},
		onEdit = () => {},
		onDelete = () => {},
		rowActions,
		children
	}: Props = $props();

	let selected = $state<Set<string>>(new Set());

	$effect(() => {
		// limpa seleção quando a lista muda
		selected = new Set();
	});

	function toggleAll(e: Event) {
		const el = e.currentTarget as HTMLInputElement;
		if (el.checked) {
			selected = new Set(records.map((r) => String(r.id)));
		} else {
			selected = new Set();
		}
	}

	function toggleOne(id: number) {
		const key = String(id);
		const next = new Set(selected);
		if (next.has(key)) next.delete(key);
		else next.add(key);
		selected = next;
	}

	const allSelected = $derived(records.length > 0 && records.every((r) => selected.has(String(r.id))));

	// Busca o rótulo/cor para o valor de um campo.
	function fmt(f: FieldMeta, v: unknown): string {
		if (v === null || v === undefined || v === '') return '';
		if (f.kind === 'bool') return v ? 'Sim' : 'Não';
		if (f.kind === 'time') {
			const s = String(v);
			if (s.length >= 10) return s.slice(0, 10);
			return s;
		}
		if (typeof v === 'object') return JSON.stringify(v ?? '');
		return String(v);
	}

	function sortIcon(field: string) {
		if (!sort || sort.field !== field) return '↕';
		return sort.desc ? '↓' : '↑';
	}
</script>

<div class="table-wrap">
	<table class="table">
		<thead>
			<tr>
				<th class="ck">
					<input type="checkbox" checked={allSelected} onchange={toggleAll} aria-label="Selecionar todos" />
				</th>
				{#each visibleFields as f (f.key)}
					<th class:sortable={f.sortable}>
						{#if f.sortable}
							<button class="th-btn" onclick={() => onSort(f.key)}>
								{f.label} <span class="arrow">{sortIcon(f.key)}</span>
							</button>
						{:else}
							{f.label}
						{/if}
					</th>
				{/each}
				<th class="actions-col"></th>
			</tr>
		</thead>
		<tbody>
			{#each records as r (String(r.id))}
				<tr>
					<td class="ck">
						<input
							type="checkbox"
							checked={selected.has(String(r.id))}
							onchange={() => toggleOne(r.id as number)}
							aria-label="Selecionar registro"
						/>
					</td>
					{#each visibleFields as f (f.key)}
						<td class="cell" title={fmt(f, r[f.key])}>{fmt(f, r[f.key])}</td>
					{/each}
					<td class="row-actions">
						{#if rowActions}
							{@render rowActions(r)}
						{/if}
						<button class="ra edit" onclick={() => onEdit(r.id as number)} title="Editar">Editar</button>
						<button class="ra delete" onclick={() => onDelete(r.id as number)} title="Excluir">Excluir</button>
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan={visibleFields.length + 2}>
						<div class="table-empty">
							<img src="/favicon.svg" alt="" width="36" />
							<p>Nenhum registro encontrado</p>
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-wrap {
		overflow: hidden;
		border-radius: var(--radius);
		border: 1px solid var(--border);
		background: var(--card-bg);
		box-shadow: var(--shadow-card);
	}
	.table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}
	thead th {
		position: sticky;
		top: 0;
	}
	th {
		text-align: left;
		padding: 11px 14px;
		font-weight: 600;
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-muted);
		border-bottom: 1px solid var(--border);
		background: #f7f8fa;
		white-space: nowrap;
	}
	.ck {
		width: 38px;
		padding: 0 0 0 14px !important;
	}
	.actions-col {
		width: 150px;
	}
	.th-btn {
		background: none;
		border: none;
		padding: 0;
		font-weight: inherit;
		color: inherit;
		font-size: inherit;
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}
	.arrow {
		color: var(--accent-strong);
		font-size: 12px;
	}
	td {
		padding: 11px 14px;
		border-bottom: 1px solid var(--border);
		vertical-align: middle;
		max-width: 260px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--text);
	}
	tr:last-child td {
		border-bottom: none;
	}
	tbody tr {
		transition: background 0.12s;
	}
	tbody tr:hover {
		background: #f4faf7;
	}
	.row-actions {
		text-align: right;
		white-space: nowrap;
		opacity: 0;
		transition: opacity 0.12s ease;
	}
	tr:hover .row-actions {
		opacity: 1;
	}
	.ra {
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		padding: 4px 9px;
		font-size: 12px;
		font-weight: 600;
		margin-left: 2px;
	}
	.ra.edit {
		color: var(--accent-strong);
	}
	.ra.edit:hover {
		background: var(--accent-soft);
		border-color: var(--accent);
	}
	.ra.delete {
		color: var(--danger);
	}
	.ra.delete:hover {
		background: var(--danger-soft);
		border-color: var(--danger);
	}
	.table-empty {
		text-align: center;
		padding: 48px 16px;
		color: var(--text-muted);
	}
	.table-empty img {
		opacity: 0.3;
		margin-bottom: 10px;
	}
</style>
