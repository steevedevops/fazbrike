import { writable } from 'svelte/store';
import { api } from './api';
import type { ModerationSummary } from './types';

const emptySummary: ModerationSummary = {
	moderation_enabled: false,
	pending_items: 0,
	open_reports: 0,
	total: 0
};

export const moderationSummary = writable<ModerationSummary>(emptySummary);

export async function loadModerationSummary(): Promise<ModerationSummary> {
	const summary = await api.moderationSummary();
	moderationSummary.set(summary);
	return summary;
}
