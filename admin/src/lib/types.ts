export type FieldKind = 'text' | 'number' | 'bool' | 'time' | 'relation';

export interface RelationMeta {
	collection: string;
	label_field: string;
}

export interface FieldMeta {
	key: string;
	label: string;
	kind: FieldKind;
	required: boolean;
	unique: boolean;
	immutable: boolean;
	hidden_in_list: boolean;
	hidden_in_form: boolean;
	editable: boolean;
	sortable: boolean;
	relation?: RelationMeta;
}

export interface CollectionMeta {
	name: string;
	label: string;
	fields: FieldMeta[];
	searchable: string[];
	default_order: { field: string; desc: boolean }[];
}

export interface MetaResponse {
	collections: CollectionMeta[];
}

export interface ListResponse {
	data: Record<string, unknown>[];
	total: number;
	page: number;
	perPage: number;
	totalPages: number;
}

export interface VisitsDailyPoint {
	date: string;
	count: number;
}

export interface VisitsTopItem {
	item_id: number;
	title: string;
	views: number;
}

export interface VisitsStatsResponse {
	total: number;
	days: number;
	daily: VisitsDailyPoint[];
	top_items: VisitsTopItem[];
}

export interface ModerationSummary {
	moderation_enabled: boolean;
	pending_items: number;
	open_reports: number;
	total: number;
}

export interface ModerationItem {
	id: number;
	title: string;
	description: string;
	price: number;
	image_url?: string;
	status: string;
	seller_name: string;
	created_at: string;
}

export interface ModerationReport {
	id: number;
	item_id: number;
	item_title: string;
	item_status: string;
	reporter_name: string;
	reason: string;
	details?: string;
	created_at: string;
}

export interface ModerationQueue<T> {
	data: T[];
	total: number;
	page: number;
	perPage: number;
}

export interface User {
	id: number;
	email: string;
	name: string;
	role: string;
	created_at: string;
	updated_at: string;
}
