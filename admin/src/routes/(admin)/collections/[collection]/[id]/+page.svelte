<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import { api, ApiError } from '$lib/api';
	import { collections, collectionsLoading } from '$lib/meta';
	import { toast } from '$lib/toast';
	import TopBar from '$lib/components/TopBar.svelte';
	import RecordForm from '$lib/components/RecordForm.svelte';

	const name = $derived(String(page.params.collection ?? ''));
	const id = $derived(String(page.params.id ?? ''));
	const collection = $derived(($collections ?? []).find((c) => c.name === name));

	let record = $state<Record<string, unknown>>({});
	let loading = $state(true);
	let busy = $state(false);
	let notFound = $state(false);

	// Recarrega sempre que muda a coleção ou o id na URL — antes isso rodava em
	// onMount (uma única vez), então navegar entre registros pelo menu deixava a
	// tela presa no registro anterior ou em "não encontrado".
	$effect(() => {
		const col = collection?.name;
		const recordId = id;
		if (!col || !recordId) return;
		untrack(() => {
			loading = true;
			notFound = false;
			void (async () => {
				try {
					record = await api.get(col, recordId);
				} catch {
					notFound = true;
				} finally {
					loading = false;
				}
			})();
		});
	});

	async function save(data: Record<string, unknown>) {
		if (!collection) return;
		busy = true;
		try {
			record = await api.update(collection.name, id, data);
			toast('success', 'Registro atualizado com sucesso.');
			goto(`/collections/${collection.name}/${id}`);
		} catch (e) {
			toast('error', e instanceof ApiError ? e.message : 'Erro ao atualizar registro.');
			busy = false;
		}
	}

	function cancel() {
		goto(`/collections/${collection?.name}`);
	}
</script>

{#if !collection && $collectionsLoading}
	<div class="spin-wrap"><div class="spinner"></div></div>
{:else if !collection || notFound}
	<div class="nope">
		<h1 class="page-title">Registro não encontrado</h1>
		<p class="page-sub">A coleção <code>{name}</code> ou o registro <code>{id}</code> não existe.</p>
		<a class="back" href="/">← Voltar</a>
	</div>
{:else if loading}
	<div class="spin-wrap"><div class="spinner"></div></div>
{:else}
	<div class="page">
		<TopBar {collection} title={`Editar · ${collection.label}`} />
		<div class="form-card">
			{#if collection.name === 'user' && record.role === 'admin'}
				<div class="warn">Você está editando um usuário administrador.</div>
			{/if}
			<RecordForm {collection} {record} {busy} onSave={save} onCancel={cancel} />
		</div>
	</div>
{/if}

<style>
	.page {
		max-width: 720px;
		width: 100%;
		margin: 0 auto;
	}
	.nope {
		padding: 24px 0;
		max-width: 720px;
		margin: 0 auto;
	}
	.back {
		display: inline-block;
		margin-top: 16px;
		color: var(--accent);
		font-weight: 600;
		font-size: 13px;
	}
	code {
		background: var(--subtle);
		padding: 1px 6px;
		border-radius: 4px;
		font-size: 12px;
	}
	.form-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 28px;
		margin-top: 20px;
		box-shadow: var(--shadow-xs);
	}
	.warn {
		background: var(--warn-soft);
		border: 1px solid var(--warn-border);
		color: var(--warn);
		border-radius: var(--radius-sm);
		padding: 10px 12px;
		margin-bottom: 18px;
		font-size: 13px;
	}
	.spin-wrap {
		display: grid;
		place-items: center;
		padding: 64px;
	}
</style>
