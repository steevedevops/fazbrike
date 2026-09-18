<script lang="ts">
	import type { CollectionMeta, FieldMeta } from '$lib/types';
	import { getEnumOptions } from '$lib/enums';
	import RelationSelect from './RelationSelect.svelte';

	interface Props {
		collection: CollectionMeta;
		record?: Record<string, unknown>;
		busy?: boolean;
		onSave: (data: Record<string, unknown>) => void;
		onCancel: () => void;
	}
	let { collection, record = undefined, busy = false, onSave, onCancel }: Props = $props();

	const editable = $derived(collection.fields.filter((f) => f.editable && !f.hidden_in_form));
	const info = $derived(collection.fields.filter((f) => f.immutable));

	let values = $state<Record<string, unknown>>({});
	$effect(() => {
		// Monta o objeto à parte e só depois atribui a `values` uma única vez.
		// Ler e escrever `values` dentro do mesmo efeito (values[f.key] = ...
		// logo após values = {}) faz o efeito depender do próprio estado que
		// ele escreve, causando um loop (effect_update_depth_exceeded) que
		// trava a navegação depois de abrir um formulário.
		const next: Record<string, unknown> = {};
		for (const f of editable) {
			const v = record ? record[f.key] : '';
			next[f.key] = v ?? '';
		}
		values = next;
	});

	function setVal(f: FieldMeta, raw: unknown) {
		let v = raw;
		if (f.relation) {
			v = raw === '' || raw === null || raw === undefined ? null : Number(raw);
		} else if (f.kind === 'number') {
			v = raw === '' ? '' : Number(raw);
		}
		values = { ...values, [f.key]: v };
	}

	function submit(e: Event) {
		e.preventDefault();
		const data: Record<string, unknown> = {};
		for (const f of editable) {
			const val = values[f.key];
			if (val === '' || val === null || val === undefined) {
				if (f.required && !record) continue;
			}
			data[f.key] = val;
		}
		onSave(data);
	}
</script>

<form class="form" onsubmit={submit}>
	{#if info.length > 0}
		<div class="info-box">
			<div class="info-title">Gerado automaticamente</div>
			<div class="info-grid">
				{#each info as f (f.key)}
					<div class="info-item">
						<span class="ik">{f.label}</span>
						<span class="iv">{record ? String(record[f.key] ?? '') : '—'}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#each editable as f (f.key)}
		<div class="field">
			<label for={`f-${f.key}`}>
				{f.label}
				{#if f.required}<span class="req">*</span>{/if}
				{#if f.unique}<span class="uniq">único</span>{/if}
			</label>

			{#if f.kind === 'bool'}
				<label class="check-row">
					<input
						id={`f-${f.key}`}
						type="checkbox"
						checked={!!values[f.key]}
						onchange={(e) => setVal(f, e.currentTarget.checked)}
						class="check"
					/>
					<span>{values[f.key] ? 'Sim' : 'Não'}</span>
				</label>
			{:else if f.kind === 'time'}
				<input id={`f-${f.key}`} type="text" value={values[f.key]} disabled title="Imutável" />
			{:else if f.relation}
				<RelationSelect
					id={`f-${f.key}`}
					collectionName={f.relation.collection}
					labelField={f.relation.label_field}
					value={values[f.key] as number | null}
					initialLabel={record ? String(record[`${f.key}_label`] ?? '') : ''}
					required={f.required}
					excludeId={f.relation.collection === collection.name ? ((record?.id as number | undefined) ?? null) : null}
					onChange={(v) => setVal(f, v)}
				/>
			{:else if f.kind === 'number'}
				<input
					id={`f-${f.key}`}
					type="number"
					step="any"
					value={String(values[f.key] ?? '')}
					oninput={(e) => setVal(f, e.currentTarget.value)}
				/>
			{:else if getEnumOptions(collection.name, f.key)}
				<select
					id={`f-${f.key}`}
					value={String(values[f.key] ?? '')}
					onchange={(e) => setVal(f, e.currentTarget.value)}
					required={f.required}
				>
					{#if !f.required}
						<option value="">— não definido —</option>
					{/if}
					{#each getEnumOptions(collection.name, f.key) ?? [] as opt (opt.value)}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			{:else if f.key === 'email'}
				<input
					id={`f-${f.key}`}
					type="email"
					value={String(values[f.key] ?? '')}
					oninput={(e) => setVal(f, e.currentTarget.value)}
					required={f.required}
				/>
			{:else if f.key === 'password' || f.label === 'Password'}
				<input
					id={`f-${f.key}`}
					type="password"
					value={String(values[f.key] ?? '')}
					oninput={(e) => setVal(f, e.currentTarget.value)}
				/>
			{:else if f.kind === 'text' && (f.key === 'description' || String(f.label).length > 24)}
				<textarea
					id={`f-${f.key}`}
					rows="4"
					value={String(values[f.key] ?? '')}
					oninput={(e) => setVal(f, e.currentTarget.value)}
					required={f.required}
				></textarea>
			{:else}
				<input
					id={`f-${f.key}`}
					type="text"
					value={String(values[f.key] ?? '')}
					oninput={(e) => setVal(f, e.currentTarget.value)}
					required={f.required}
				/>
			{/if}
		</div>
	{/each}

	<div class="actions">
		<button type="button" class="btn ghost" onclick={onCancel} disabled={busy}>Cancelar</button>
		<button type="submit" class="btn primary" disabled={busy}>
			{busy ? 'Salvando…' : record ? 'Salvar alterações' : 'Criar'}
		</button>
	</div>
</form>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}
	.info-box {
		background: var(--subtle);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 14px 16px;
	}
	.info-title {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--faint);
		margin-bottom: 10px;
		font-weight: 600;
	}
	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 10px 14px;
	}
	.info-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.ik {
		font-size: 11px;
		color: var(--faint);
	}
	.iv {
		font-size: 13px;
		font-weight: 500;
		color: var(--ink);
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	label {
		font-size: 13px;
		font-weight: 600;
		color: var(--ink);
	}
	.req {
		color: var(--danger);
		margin-left: 2px;
	}
	.uniq {
		margin-left: 6px;
		font-size: 11px;
		font-weight: 500;
		color: var(--muted);
		background: var(--subtle);
		padding: 1px 7px;
		border-radius: 999px;
		border: 1px solid var(--border);
	}
	select,
	input[type='text'],
	input[type='email'],
	input[type='password'],
	input[type='number'],
	textarea {
		padding: 9px 12px;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		font-size: 13px;
		resize: vertical;
		outline: none;
		background: var(--surface);
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	select:focus,
	input:focus,
	textarea:focus {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-soft);
	}
	input:disabled {
		background: var(--subtle);
		color: var(--muted);
	}
	.check-row {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-weight: 500;
		color: var(--muted);
		cursor: pointer;
	}
	.check {
		width: 16px;
		height: 16px;
		accent-color: var(--accent);
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		padding-top: 8px;
		border-top: 1px solid var(--border);
		margin-top: 4px;
	}
</style>
