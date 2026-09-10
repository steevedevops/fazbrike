import { writable } from 'svelte/store';
import { api } from './api';
import type { CollectionMeta, MetaResponse } from './types';

export const collections = writable<CollectionMeta[]>([]);
export const collectionsLoading = writable(false);
let loaded = false;

export async function loadCollections(force = false): Promise<void> {
	if (loaded && !force) return;
	collectionsLoading.set(true);
	try {
		const meta: MetaResponse = await api.meta();
		collections.set(meta.collections);
		loaded = true;
	} finally {
		collectionsLoading.set(false);
	}
}

export function findCollection(name: string): CollectionMeta | undefined {
	let found: CollectionMeta | undefined;
	collections.subscribe((c) => {
		found = c.find((x) => x.name === name);
	})();
	return found;
}
