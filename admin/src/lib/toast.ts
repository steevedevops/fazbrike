import { writable } from 'svelte/store';

export interface Toast {
	id: number;
	type: 'success' | 'error' | 'info';
	message: string;
}

let counter = 0;

export const toasts = writable<Toast[]>([]);

export function toast(type: Toast['type'], message: string) {
	const id = ++counter;
	toasts.update((t) => [...t, { id, type, message }]);
	setTimeout(() => {
		toasts.update((t) => t.filter((x) => x.id !== id));
	}, 4000);
}
