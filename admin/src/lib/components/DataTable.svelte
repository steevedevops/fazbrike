<script lang="ts">
	import type { CollectionMeta, FieldMeta } from '$lib/types';
	import type { Snippet } from 'svelte';
	import { getEnumOption } from '$lib/enums';
	import StatusBadge from './StatusBadge.svelte';

	interface Props {
		collection: CollectionMeta;
		records: Record<string, unknown>[];
		visibleFields: FieldMeta[];
		sort?: { field: string; desc: boolean } | null;
		onSort?: (field: string) => void;
		onEdit?: (id: number) => void;
		onDelete?: (id: number) => void;
		rowActions?: Snippet<[Record<string, unknown>]>;
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

	// Limpa a seleção sempre que a lista muda (troca de coleção, página ou busca).
	$effect(() => {
		if (records) selected = new Set();
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

	function fmt(f: FieldMeta, v: unknown): string {
		if (v === null || v === undefined || v === '') return '—';
		if (f.kind === 'bool') return v ? 'Sim' : 'Não';
		if (f.kind === 'time') {
			const s = String(v);
			if (s.length >= 10) return s.slice(0, 10);
			return s;
		}
		if (typeof v === 'object') return JSON.stringify(v ?? '');
		return String(v);
	}

	// Campos de relação (ex.: user_id) trazem o rótulo já resolvido pelo backend
	// em "<key>_label" (1 query em lote por coluna, não por linha — ver
	// attachRelationLabels no backend). Sem isso, o valor cru seria só o ID.
	function relationLabel(f: FieldMeta, r: Record<string, unknown>): string {
		const label = r[`${f.key}_label`];
		if (label !== null && label !== undefined && label !== '') return String(label);
		const raw = r[f.key];
		if (raw === null || raw === undefined || raw === '') return '—';
		return `#${raw}`;
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
							<button class="th-btn" type="button" onclick={() => onSort(f.key)}>
								{f.label} <span class="arrow">{sortIcon(f.key)}</span>
							</button>
						{:else}
							{f.label}
						{/if}
					</th>
				{/each}
				<th class="actions-col">Ações</th>
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
					{#each visibleFields as f, index (f.key)}
						{@const enumOption = getEnumOption(collection.name, f.key, r[f.key])}
						{#if f.relation}
							<td class="cell" title={relationLabel(f, r)}>
								{#if index === 0}
									<a
										class="record-link"
										href={`/collections/${collection.name}/${r.id}`}
										aria-label={`Editar registro ${r.id}`}
									>
										{relationLabel(f, r)}
									</a>
								{:else}
									{relationLabel(f, r)}
								{/if}
							</td>
						{:else if enumOption && r[f.key] !== null && r[f.key] !== undefined && r[f.key] !== ''}
							<td class="cell">
								{#if index === 0}
									<a
										class="record-link"
										href={`/collections/${collection.name}/${r.id}`}
										aria-label={`Editar registro ${r.id}`}
									>
										<StatusBadge option={enumOption} />
									</a>
								{:else}
									<StatusBadge option={enumOption} />
								{/if}
							</td>
						{:else}
							<td class="cell" title={fmt(f, r[f.key])}>
								{#if index === 0}
									<a
										class="record-link"
										href={`/collections/${collection.name}/${r.id}`}
										aria-label={`Editar registro ${r.id}`}
									>
										{fmt(f, r[f.key])}
									</a>
								{:else}
									{fmt(f, r[f.key])}
								{/if}
							</td>
						{/if}
					{/each}
					<td class="row-actions">
						{#if rowActions}
							{@render rowActions(r)}
						{/if}
						<button class="ra edit" type="button" onclick={() => onEdit(r.id as number)}>Editar</button>
						<button class="ra delete" type="button" onclick={() => onDelete(r.id as number)}>Excluir</button>
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan={visibleFields.length + 2}>
						<div class="table-empty">
							<p class="empty-title">Nenhum registro</p>
							<p class="empty-sub">Crie o primeiro registro ou ajuste a busca.</p>
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-wrap {
		overflow: auto;
		border-radius: var(--radius);
		border: 1px solid var(--border);
		background: var(--surface);
		box-shadow: var(--shadow-xs);
	}
	.table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}
	th {
		text-align: left;
		padding: 10px 14px;
		font-weight: 600;
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--faint);
		border-bottom: 1px solid var(--border);
		background: var(--subtle);
		white-space: nowrap;
		position: sticky;
		top: 0;
		z-index: 1;
	}
	.ck {
		width: 40px;
		padding-left: 14px !important;
	}
	.actions-col {
		width: 1%;
		text-align: right;
	}
	.th-btn {
		background: none;
		border: none;
		padding: 0;
		font-weight: inherit;
		color: inherit;
		font-size: inherit;
		letter-spacing: inherit;
		text-transform: inherit;
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}
	.th-btn:hover {
		color: var(--ink);
	}
	.arrow {
		color: var(--accent);
		font-size: 11px;
		opacity: 0.7;
	}
	td {
		padding: 12px 14px;
		border-bottom: 1px solid var(--border);
		vertical-align: middle;
		max-width: 280px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--ink);
	}
	tr:last-child td {
		border-bottom: none;
	}
	tbody tr {
		transition: background 0.1s;
	}
	tbody tr:hover {
		background: rgba(20, 18, 16, 0.025);
	}
	.record-link {
		display: block;
		margin: -12px -14px;
		padding: 12px 14px;
		font-weight: 600;
		color: var(--ink);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.record-link:hover {
		text-decoration: underline;
	}
	.row-actions {
		text-align: right;
		white-space: nowrap;
	}
	.ra {
		border: 1px solid transparent;
		border-radius: var(--radius-xs);
		padding: 5px 10px;
		font-size: 12px;
		font-weight: 550;
		margin-left: 2px;
		background: transparent;
		transition: background 0.12s, border-color 0.12s, color 0.12s;
	}
	.ra.edit {
		color: var(--muted);
	}
	.ra.edit:hover {
		color: var(--ink);
		background: var(--subtle);
		border-color: var(--border);
	}
	.ra.delete {
		color: var(--danger);
	}
	.ra.delete:hover {
		background: var(--danger-soft);
		border-color: transparent;
	}
	.table-empty {
		text-align: center;
		padding: 56px 16px;
	}
	.empty-title {
		font-weight: 600;
		color: var(--ink);
		margin-bottom: 4px;
	}
	.empty-sub {
		color: var(--muted);
		font-size: 13px;
	}
</style>
