<script lang="ts">
	import type { CollectionMeta, FieldMeta } from '$lib/types';

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
		values = {};
		for (const f of editable) {
			const v = record ? record[f.key] : '';
			values[f.key] = v ?? '';
		}
	});

	function setVal(f: FieldMeta, raw: unknown) {
		let v = raw;
		if (f.kind === 'number') {
			v = raw === '' ? '' : Number(raw);
		}
		values = { ...values, [f.key]: v };
	}

	function submit(e: Event) {
		e.preventDefault();
		// remove chaves vazias para não sobrescrever com '' quando não obrigatório
		const data: Record<string, unknown> = {};
		for (const f of editable) {
			const val = values[f.key];
			if (val === '' || val === null || val === undefined) {
				if (f.required && !record) continue; // deixa o validador reportar? simplifica: envia vazio
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
				<input
					id={`f-${f.key}`}
					type="checkbox"
					checked={!!values[f.key]}
					onchange={(e) => setVal(f, e.currentTarget.checked)}
					class="check"
				/>
			{:else if f.kind === 'time'}
				<input id={`f-${f.key}`} type="text" value={values[f.key]} disabled title="Imutável" />
			{:else if f.kind === 'number'}
				<input
					id={`f-${f.key}`}
					type="number"
					step="any"
					value={String(values[f.key] ?? '')}
					oninput={(e) => setVal(f, e.currentTarget.value)}
				/>
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
		gap: 16px;
	}
	.info-box {
		background: #f7f8fa;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 12px 14px;
	}
	.info-title {
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.4px;
		color: var(--text-muted);
		margin-bottom: 8px;
	}
	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 8px 12px;
	}
	.info-item {
		display: flex;
		flex-direction: column;
	}
	.ik {
		font-size: 11px;
		color: var(--text-muted);
	}
	.iv {
		font-size: 13px;
		font-weight: 500;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	label {
		font-size: 13px;
		font-weight: 600;
		color: var(--text);
	}
	.req {
		color: var(--danger);
		margin-left: 2px;
	}
	.uniq {
		margin-left: 6px;
		font-size: 11px;
		font-weight: 500;
		color: var(--text-muted);
		background: #eef0f3;
		padding: 1px 7px;
		border-radius: 999px;
	}
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
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	input:focus,
	textarea:focus {
		border-color: var(--accent-strong);
		box-shadow: 0 0 0 3px var(--accent-soft);
	}
	input:disabled {
		background: #f5f5f5;
		color: var(--text-muted);
	}
	.check {
		width: 18px;
		height: 18px;
		accent-color: var(--accent-strong);
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		padding-top: 16px;
		border-top: 1px solid var(--border);
	}
	.btn {
		padding: 9px 18px;
		border-radius: var(--radius-sm);
		font-size: 13px;
		font-weight: 600;
		border: 1px solid transparent;
		transition: background 0.15s, border-color 0.15s;
	}
	.btn.ghost {
		background: #fff;
		border-color: var(--border-strong);
		color: var(--text);
	}
	.btn.ghost:hover {
		background: #f5f5f5;
	}
	.btn.primary {
		background: var(--accent-strong);
		color: #fff;
	}
	.btn.primary:hover {
		background: var(--accent-hover);
	}
	.btn:disabled {
		opacity: 0.6;
		cursor: default;
	}
</style>
