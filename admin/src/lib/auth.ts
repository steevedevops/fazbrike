import { writable, get } from 'svelte/store';
import { api, setToken } from './api';
import type { User } from './types';

export const currentUser = writable<User | null>(null);
export const authLoading = writable(false);

// Inicialização: se houver token salvo, valida via /auth/me.
export async function initAuth(): Promise<void> {
	const token = typeof localStorage !== 'undefined' ? localStorage.getItem('fazbrike_admin_token') : null;
	if (!token) {
		currentUser.set(null);
		return;
	}
	try {
		const me = await api.me();
		currentUser.set({ ...me, role: me.role || 'user' });
	} catch {
		setToken(null);
		currentUser.set(null);
	}
}

export async function login(email: string, password: string): Promise<User> {
	authLoading.set(true);
	try {
		const { token, user } = await api.login(email, password);
		setToken(token);
		currentUser.set(user);
		return user;
	} finally {
		authLoading.set(false);
	}
}

export function logout() {
	setToken(null);
	currentUser.set(null);
}

export interface DecodedToken {
	user_id?: number;
	role?: string;
	exp?: number;
	[n: string]: unknown;
}

/**
 * Decodifica o payload do JWT armazenado (parte central, base64url).
 * Retorna null se não houver token ou se o payload for inválido.
 */
export function getActiveToken(): { token: string; payload: DecodedToken } | null {
	if (typeof localStorage === 'undefined') return null;
	const token = localStorage.getItem('fazbrike_admin_token');
	if (!token) return null;
	const parts = token.split('.');
	if (parts.length !== 3) return null;
	try {
		const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
		const json = decodeURIComponent(
			atob(base64)
				.split('')
				.map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
				.join('')
		);
		return { token, payload: JSON.parse(json) as DecodedToken };
	} catch {
		return null;
	}
}

export function isAdmin(): boolean {
	const u = get(currentUser);
	return !!u && u.role === 'admin';
}
