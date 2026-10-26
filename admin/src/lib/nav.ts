import type { CollectionMeta } from './types';

export type NavIcon =
	| 'layout-dashboard'
	| 'shield'
	| 'bar-chart'
	| 'package'
	| 'image'
	| 'tag'
	| 'zap'
	| 'megaphone'
	| 'eye'
	| 'heart'
	| 'flag'
	| 'users'
	| 'user'
	| 'id-card'
	| 'user-plus'
	| 'key'
	| 'mail'
	| 'message'
	| 'star'
	| 'badge-check'
	| 'bell'
	| 'smartphone'
	| 'handshake'
	| 'store'
	| 'book-open'
	| 'scale'
	| 'life-buoy'
	| 'globe'
	| 'map'
	| 'map-pin'
	| 'settings'
	| 'database'
	| 'sliders'
	| 'folder'
	| 'chevron'
	| 'search'
	| 'log-out'
	| 'menu';

export interface NavItem {
	id: string;
	href: string;
	label: string;
	icon: NavIcon;
	collection?: string;
}

export interface NavSection {
	id: string;
	label: string;
	icon: NavIcon;
	blurb: string;
	items: NavItem[];
}

interface CollectionEntry {
	name: string;
	icon: NavIcon;
}

interface SectionDef {
	id: string;
	label: string;
	icon: NavIcon;
	blurb: string;
	entries: CollectionEntry[];
}

const COLLECTION_SECTIONS: SectionDef[] = [
	{
		id: 'anuncios',
		label: 'Anúncios',
		icon: 'package',
		blurb: 'Catálogo, mídia e destaque',
		entries: [
			{ name: 'item', icon: 'package' },
			{ name: 'item_image', icon: 'image' },
			{ name: 'category', icon: 'tag' },
			{ name: 'promotion', icon: 'megaphone' },
			{ name: 'boost', icon: 'zap' },
			{ name: 'item_view', icon: 'eye' },
			{ name: 'item_favorite', icon: 'heart' },
			{ name: 'item_report', icon: 'flag' }
		]
	},
	{
		id: 'pessoas',
		label: 'Pessoas',
		icon: 'users',
		blurb: 'Contas, perfis e acessos',
		entries: [
			{ name: 'user', icon: 'user' },
			{ name: 'user_profile', icon: 'id-card' },
			{ name: 'follow', icon: 'user-plus' },
			{ name: 'social_account', icon: 'key' },
			{ name: 'email_verification_code', icon: 'mail' }
		]
	},
	{
		id: 'comunidade',
		label: 'Comunidade',
		icon: 'message',
		blurb: 'Conversas, avaliações e avisos',
		entries: [
			{ name: 'message', icon: 'message' },
			{ name: 'item_comment', icon: 'message' },
			{ name: 'review', icon: 'star' },
			{ name: 'item_sale_feedback', icon: 'badge-check' },
			{ name: 'notification', icon: 'bell' },
			{ name: 'device_token', icon: 'smartphone' }
		]
	},
	{
		id: 'afiliados',
		label: 'Afiliados',
		icon: 'handshake',
		blurb: 'Parceiros e ofertas',
		entries: [
			{ name: 'affiliate_partner', icon: 'handshake' },
			{ name: 'affiliate_product', icon: 'store' }
		]
	},
	{
		id: 'conteudo',
		label: 'Conteúdo',
		icon: 'book-open',
		blurb: 'Ajuda, termos e suporte',
		entries: [
			{ name: 'help_article', icon: 'book-open' },
			{ name: 'legal_document', icon: 'scale' },
			{ name: 'support_request', icon: 'life-buoy' }
		]
	},
	{
		id: 'localidades',
		label: 'Localidades',
		icon: 'map',
		blurb: 'Países, estados e cidades',
		entries: [
			{ name: 'country', icon: 'globe' },
			{ name: 'state', icon: 'map' },
			{ name: 'city', icon: 'map-pin' }
		]
	},
	{
		id: 'sistema',
		label: 'Sistema',
		icon: 'settings',
		blurb: 'Sessão, backup e chaves',
		entries: [{ name: 'configuration', icon: 'sliders' }]
	}
];

function collectionItem(col: CollectionMeta, icon: NavIcon): NavItem {
	return {
		id: col.name,
		href: `/collections/${col.name}`,
		label: col.label,
		icon,
		collection: col.name
	};
}

export function buildSections(collections: CollectionMeta[]): NavSection[] {
	const byName = new Map(collections.map((c) => [c.name, c]));
	const used = new Set<string>();

	const sections: NavSection[] = [
		{
			id: 'painel',
			label: 'Painel',
			icon: 'layout-dashboard',
			blurb: 'Operação do dia a dia',
			items: [
				{ id: 'overview', href: '/', label: 'Visão geral', icon: 'layout-dashboard' },
				{ id: 'moderation', href: '/moderation', label: 'Moderação', icon: 'shield' },
				{ id: 'visits', href: '/visits', label: 'Visitas', icon: 'bar-chart' }
			]
		}
	];

	for (const def of COLLECTION_SECTIONS) {
		const items: NavItem[] = [];
		if (def.id === 'sistema') {
			items.push(
				{ id: 'settings', href: '/settings', label: 'Sessão', icon: 'settings' },
				{ id: 'backup', href: '/backup', label: 'Backup', icon: 'database' }
			);
		}
		for (const entry of def.entries) {
			const col = byName.get(entry.name);
			if (!col) continue;
			used.add(col.name);
			items.push(collectionItem(col, entry.icon));
		}
		if (items.length > 0) {
			sections.push({
				id: def.id,
				label: def.label,
				icon: def.icon,
				blurb: def.blurb,
				items
			});
		}
	}

	const others = collections.filter((c) => !used.has(c.name));
	if (others.length > 0) {
		sections.push({
			id: 'outros',
			label: 'Outros',
			icon: 'folder',
			blurb: 'Coleções ainda sem categoria',
			items: others.map((c) => collectionItem(c, 'folder'))
		});
	}

	return sections;
}

export function itemIsActive(pathname: string, href: string): boolean {
	if (href === '/') return pathname === '/';
	return pathname === href || pathname.startsWith(`${href}/`);
}

export function activeSectionId(sections: NavSection[], pathname: string): string | undefined {
	for (const section of sections) {
		if (section.items.some((item) => itemIsActive(pathname, item.href))) return section.id;
	}
	return undefined;
}

export interface Crumb {
	href?: string;
	label: string;
}

export function breadcrumb(sections: NavSection[], pathname: string): Crumb[] {
	for (const section of sections) {
		for (const item of section.items) {
			if (!itemIsActive(pathname, item.href)) continue;
			if (item.href === '/' && pathname === '/') return [{ label: 'Visão geral' }];
			const crumbs: Crumb[] = [{ label: section.label }, { href: item.href, label: item.label }];
			if (pathname.endsWith('/new')) crumbs.push({ label: 'Novo' });
			else if (/^\/collections\/[^/]+\/[^/]+$/.test(pathname) && pathname !== item.href) {
				crumbs.push({ label: 'Editar' });
			}
			return crumbs;
		}
	}
	return [{ label: 'Admin' }];
}
