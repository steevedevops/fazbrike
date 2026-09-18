import { writable } from 'svelte/store';
import { api } from './api';
import type { CollectionMeta, MetaResponse } from './types';

export const collections = writable<CollectionMeta[]>([]);
export const collectionsLoading = writable(false);
let loaded = false;
let inflight: Promise<void> | null = null;

export async function loadCollections(force = false): Promise<void> {
	if (loaded && !force) return;
	if (inflight && !force) return inflight;
	collectionsLoading.set(true);
	inflight = (async () => {
		try {
			const meta: MetaResponse = await api.meta();
			const list = meta.collections ?? [];
			collections.set(list);
			loaded = list.length > 0;
		} catch (e) {
			console.error('Falha ao carregar coleções', e);
			// não marca loaded — tenta de novo na próxima chamada
			loaded = false;
		} finally {
			collectionsLoading.set(false);
			inflight = null;
		}
	})();
	return inflight;
}

export function findCollection(name: string): CollectionMeta | undefined {
	let found: CollectionMeta | undefined;
	collections.subscribe((c) => {
		found = c.find((x) => x.name === name);
	})();
	return found;
}
