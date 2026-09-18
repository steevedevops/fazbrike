<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import { api, ApiError } from '$lib/api';
	import { collections, collectionsLoading } from '$lib/meta';
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
	let loading = $state(false);
	let search = $state('');
	let sort = $state<{ field: string; desc: boolean } | null>(null);
	let deleteTarget = $state<number | null>(null);
	let deleting = $state(false);

	function visible(c: CollectionMeta | undefined) {
		return (c?.fields ?? []).filter((f) => !f.hidden_in_list && f.key !== 'id').slice(0, 4);
	}

	async function load() {
		const col = untrack(() => collection);
		if (!col) return;
		loading = true;
		try {
			const pageNum = untrack(() => result.page);
			const perPage = untrack(() => result.perPage);
			const q = untrack(() => search.trim());
			const s = untrack(() => sort);
			const params: Record<string, string | number> = { page: pageNum, perPage };
			if (q) params.search = q;
			if (s) params.sort = `${s.field}:${s.desc ? 'desc' : 'asc'}`;
			result = await api.list(col.name, params);
			records = result.data;
		} catch (e) {
			toast('error', 'Erro ao carregar registros.');
			console.error(e);
		} finally {
			loading = false;
		}
	}

	// Recarrega ao trocar de coleção no menu lateral (sem loop reativo).
	$effect(() => {
		const key = collection?.name;
		if (!key) return;
		untrack(() => {
			result = { data: [], total: 0, page: 1, perPage: result.perPage || 20, totalPages: 0 };
			search = '';
			sort = null;
			void load();
		});
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

</script>

{#if !collection && $collectionsLoading}
	<div class="spin-wrap"><div class="spinner"></div></div>
{:else if !collection}
	<div class="nope">
		<h1 class="page-title">Coleção não encontrada</h1>
		<p class="page-sub">A coleção <code>{name}</code> não existe.</p>
		<a class="back" href="/">← Voltar</a>
	</div>
{:else}
	<TopBar {collection} onSearch={onSearch} searchPlaceholder={`Pesquisar ${collection.label.toLowerCase()}…`}>
		{#snippet actions()}
			<button class="btn primary" type="button" onclick={goNew}>+ Novo</button>
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
							type="button"
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
		padding: 24px 0;
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
	.list-body {
		margin-top: 20px;
	}
	.spin-wrap {
		display: grid;
		place-items: center;
		padding: 64px;
	}
	.ra.role {
		border: 1px solid transparent;
		border-radius: var(--radius-xs);
		padding: 5px 10px;
		font-size: 12px;
		font-weight: 600;
		margin-left: 2px;
		background: transparent;
		color: var(--muted);
	}
	.ra.role:hover {
		background: var(--subtle);
		color: var(--ink);
	}
	.ra.role.admin {
		color: var(--warn);
	}
	.ra.role.admin:hover {
		background: var(--warn-soft);
	}
</style>
