<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { api, ApiError } from '$lib/api';
	import { collections } from '$lib/meta';
	import { toast } from '$lib/toast';
	import type { CollectionMeta } from '$lib/types';
	import TopBar from '$lib/components/TopBar.svelte';
	import RecordForm from '$lib/components/RecordForm.svelte';

	const name = $derived(String(page.params.collection ?? ''));
	const collection = $derived(($collections ?? []).find((c) => c.name === name));

	let busy = $state(false);

	async function save(data: Record<string, unknown>) {
		if (!collection) return;
		busy = true;
		try {
			const rec = await api.create(collection.name, data);
			toast('success', 'Registro criado com sucesso.');
			goto(`/collections/${collection.name}/${rec.id}`);
		} catch (e) {
			toast('error', e instanceof ApiError ? e.message : 'Erro ao criar registro.');
			busy = false;
		}
	}

	function cancel() {
		goto(`/collections/${collection?.name}`);
	}
</script>

{#if !collection}
	<p>Coleção não encontrada.</p>
{:else}
	<TopBar {collection} />
	<div class="form-card">
		<h2 class="title">Novo registro em {collection.label}</h2>
		<RecordForm {collection} {busy} onSave={save} onCancel={cancel} />
	</div>
{/if}

<style>
	.form-card {
		background: var(--card-bg);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 26px;
		margin-top: 6px;
		max-width: 720px;
		box-shadow: var(--shadow-card);
	}
	.title {
		font-size: 18px;
		font-weight: 700;
		margin: 0 0 22px;
	}
</style>
