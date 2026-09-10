<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { api, ApiError } from '$lib/api';
	import { collections } from '$lib/meta';
	import { toast } from '$lib/toast';
	import type { CollectionMeta } from '$lib/types';
	import TopBar from '$lib/components/TopBar.svelte';
	import RecordForm from '$lib/components/RecordForm.svelte';

	const name = $derived(String(page.params.collection ?? ''));
	const id = $derived(String(page.params.id ?? ''));
	const collection = $derived(($collections ?? []).find((c) => c.name === name));

	let record = $state<Record<string, unknown>>({});
	let loading = $state(true);
	let busy = $state(false);
	let notFound = $state(false);

	onMount(async () => {
		if (!collection) {
			notFound = true;
			loading = false;
			return;
		}
		try {
			record = await api.get(collection.name, id);
		} catch (e) {
			notFound = true;
		} finally {
			loading = false;
		}
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

{#if !collection || notFound}
	<div class="nope">
		<h1>Registro não encontrado</h1>
		<p>A collection <code>{name}</code> ou o registro <code>{id}</code> não existe.</p>
		<a href="/">← Voltar para a visão geral</a>
	</div>
{:else if loading}
	<div class="spin-wrap"><div class="spinner"></div></div>
{:else}
	<TopBar {collection} />
	<div class="form-card">
		<h2 class="title">Editar registro</h2>
		{#if collection.name === 'user' && record.role === 'admin'}
			<div class="warn">Você está editando um usuário administrador.</div>
		{/if}
		<RecordForm {collection} {record} {busy} onSave={save} onCancel={cancel} />
	</div>
{/if}

<style>
	.nope {
		padding: 40px;
	}
	.nope h1 {
		font-size: 22px;
		margin-bottom: 8px;
	}
	.nope a {
		color: var(--accent-strong);
		font-weight: 600;
	}
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
	.warn {
		background: #fff7e6;
		border: 1px solid #f0c36d;
		color: #7a5900;
		border-radius: var(--radius-sm);
		padding: 8px 12px;
		margin-bottom: 16px;
		font-size: 13px;
	}
	.spin-wrap {
		display: grid;
		place-items: center;
		padding: 60px;
	}
	.spinner {
		width: 30px;
		height: 30px;
		border: 3px solid var(--border);
		border-top-color: var(--accent-strong);
		border-radius: 50%;
		animation: rot 0.8s linear infinite;
	}
	@keyframes rot {
		to {
			transform: rotate(360deg);
		}
	}
</style>
