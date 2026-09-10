import { PUBLIC_API_URL } from '$env/static/public';
import type { MetaResponse, ListResponse, User } from './types';

const BASE = (PUBLIC_API_URL || 'http://localhost:8080/api').replace(/\/$/, '');
const TOKEN_KEY = 'fazbrike_admin_token';

export class ApiError extends Error {
	status: number;
	constructor(message: string, status: number) {
		super(message);
		this.status = status;
	}
}

function getToken(): string | null {
	if (typeof localStorage === 'undefined') return null;
	return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
	if (typeof localStorage === 'undefined') return;
	if (token) localStorage.setItem(TOKEN_KEY, token);
	else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const token = getToken();
	const headers: Record<string, string> = {
		...((options.headers as Record<string, string>) ?? {})
	};
	if (options.body && typeof options.body === 'string') {
		headers['Content-Type'] = 'application/json';
	}
	if (token) headers['Authorization'] = `Bearer ${token}`;

	const res = await fetch(`${BASE}${path}`, { ...options, headers });

	if (res.status === 401) {
		// Token expirado/inválido: limpa e propaga para o guard de rota redirecionar.
		setToken(null);
	}

	if (!res.ok) {
		let message = `Erro ${res.status}`;
		try {
			const body = await res.json();
			if (body?.error) message = body.error;
		} catch {
			/* corpo não-JSON */
		}
		throw new ApiError(message, res.status);
	}
	return (await res.json()) as T;
}

export const api = {
	login: (email: string, password: string) =>
		request<{ token: string; user: User }>('/auth/login', {
			method: 'POST',
			body: JSON.stringify({ email, password })
		}),
	me: () => request<User>('/auth/me'),
	meta: () => request<MetaResponse>('/admin/meta'),
	stats: () => request<Record<string, number>>('/admin/stats'),
	list: (collection: string, params: Record<string, string | number> = {}) => {
		const qs = new URLSearchParams();
		for (const [k, v] of Object.entries(params)) {
			if (v !== undefined && v !== '' && v !== null) qs.set(k, String(v));
		}
		return request<ListResponse>(`/admin/${collection}?${qs.toString()}`);
	},
	get: (collection: string, id: string | number) =>
		request<Record<string, unknown>>(`/admin/${collection}/${id}`),
	create: (collection: string, data: Record<string, unknown>) =>
		request<Record<string, unknown>>(`/admin/${collection}`, {
			method: 'POST',
			body: JSON.stringify(data)
		}),
	update: (collection: string, id: string | number, data: Record<string, unknown>) =>
		request<Record<string, unknown>>(`/admin/${collection}/${id}`, {
			method: 'PUT',
			body: JSON.stringify(data)
		}),
	remove: (collection: string, id: string | number) =>
		request<{ success: boolean }>(`/admin/${collection}/${id}`, { method: 'DELETE' })
};
