<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { api, ApiError } from '$lib/api';
	import { collections } from '$lib/meta';
	import { toast } from '$lib/toast';
	import type { CollectionMeta, ListResponse } from '$lib/types';
	import TopBar from '$lib/components/TopBar.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';

	const name = $derived(String(page.params.collection ?? ''));
	const collection = $derived(($collections ?? []).find((c) => c.name === name));

	let records = $state<Record<string, unknown>[]>([]);
	let result = $state<ListResponse>({ data: [], total: 0, page: 1, perPage: 20, totalPages: 0 });
	let loading = $state(true);
	let search = $state('');
	let sort = $state<{ field: string; desc: boolean } | null>(null);
	let deleteTarget = $state<number | null>(null);
	let deleting = $state(false);

	function visible(c: CollectionMeta | undefined) {
		return (c?.fields ?? []).filter((f) => !f.hidden_in_list && f.key !== 'id').slice(0, 4);
	}

	async function load() {
		if (!collection) return;
		loading = true;
		try {
			const params: Record<string, string | number> = { page: result.page, perPage: result.perPage };
			if (search.trim()) params.search = search.trim();
			if (sort) params.sort = `${sort.field}:${sort.desc ? 'desc' : 'asc'}`;
			result = await api.list(collection.name, params);
			records = result.data;
		} catch (e) {
			toast('error', 'Erro ao carregar registros.');
			console.error(e);
		} finally {
			loading = false;
		}
	}

	let first = true;
	$effect(() => {
		if (collection) {
			if (!first) load();
			first = false;
		}
	});

	let searchTimer: ReturnType<typeof setTimeout> | undefined;
	function onSearch(v: string) {
		search = v;
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			result.page = 1;
			load();
		}, 350);
	}

	function onPage(p: number) {
		result.page = p;
		load();
	}

	function onPerPage(n: number) {
		result.perPage = n;
		result.page = 1;
		load();
	}

	function onSort(field: string) {
		if (sort && sort.field === field) {
			sort = { field, desc: !sort.desc };
		} else {
			sort = { field, desc: false };
		}
		load();
	}

	function goNew() {
		goto(`/collections/${collection?.name}/new`);
	}

	function goEdit(id: number) {
		goto(`/collections/${collection?.name}/${id}`);
	}

	async function toggleRole(rec: Record<string, unknown>) {
		if (!collection) return;
		const id = rec.id;
		const newRole = rec.role === 'admin' ? 'user' : 'admin';
		try {
			await api.update(collection.name, id as number, { role: newRole });
			toast('success', `Papel alterado para "${newRole}".`);
			await load();
		} catch (e) {
			toast('error', e instanceof ApiError ? e.message : 'Erro ao alterar o papel.');
		}
	}

	async function confirmDelete() {
		if (!collection || deleteTarget === null) return;
		deleting = true;
		try {
			await api.remove(collection.name, deleteTarget);
			toast('success', 'Registro excluído com sucesso.');
			deleteTarget = null;
			await load();
		} catch (e) {
			toast('error', e instanceof ApiError ? e.message : 'Erro ao excluir registro.');
		} finally {
			deleting = false;
		}
	}

	onMount(() => {
		load();
	});
</script>

{#if !collection}
	<div class="nope">
		<h1>Coleção não encontrada</h1>
		<p>A coleção <code>{name}</code> não existe.</p>
		<a href="/">← Voltar para a visão geral</a>
	</div>
{:else}
	<TopBar {collection} onSearch={onSearch} searchPlaceholder={`Pesquisar ${collection.label.toLowerCase()}…`}>
		{#snippet actions()}
			<button class="new-btn" onclick={goNew}>
				<span class="plus">+</span> Novo registro
			</button>
		{/snippet}
	</TopBar>

	<div class="list-body">
		{#if loading}
			<div class="spin-wrap"><div class="spinner"></div></div>
		{:else}
			<DataTable
				{collection}
				{records}
				visibleFields={visible(collection)}
				{sort}
				{onSort}
				onEdit={goEdit}
				onDelete={(id) => (deleteTarget = id)}
			>
				{#if collection.name === 'user'}
					{#snippet rowActions(r: Record<string, unknown>)}
						<button
							class="ra role"
							class:admin={r.role === 'admin'}
							onclick={() => toggleRole(r)}
							title={r.role === 'admin' ? 'Rebaixar para usuário' : 'Tornar administrador'}
						>
							{r.role === 'admin' ? 'Rebaixar' : 'Tornar admin'}
						</button>
					{/snippet}
				{/if}
			</DataTable>
			<Pagination {result} {onPage} {onPerPage} />
		{/if}
	</div>

	<ConfirmModal
		open={deleteTarget !== null}
		busy={deleting}
		onConfirm={confirmDelete}
		onCancel={() => (deleteTarget = null)}
		message="O registro será excluído permanentemente. Essa ação não pode ser desfeita."
	/>
{/if}

<style>
	.nope {
		padding: 40px;
	}
	.nope h1 {
		font-size: 22px;
		margin-bottom: 8px;
	}
	.nope p {
		color: var(--text-muted);
		margin-bottom: 16px;
	}
	.nope a {
		color: var(--accent-strong);
		font-weight: 600;
	}
	.new-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: var(--accent-strong);
		color: #fff;
		border: none;
		border-radius: var(--radius-sm);
		padding: 8px 14px;
		font-weight: 600;
		font-size: 13px;
	}
	.new-btn:hover {
		background: #1d9c6e;
	}
	.ra.role {
		color: var(--accent-strong);
		border-color: transparent;
	}
	.ra.role:hover {
		background: var(--accent-soft);
		border-color: var(--accent);
	}
	.ra.role.admin {
		color: #b45309;
	}
	.ra.role.admin:hover {
		background: rgba(245, 158, 11, 0.12);
		border-color: #f59e0b;
	}
	.plus {
		font-size: 16px;
		line-height: 1;
	}
	.list-body {
		margin-top: 16px;
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
