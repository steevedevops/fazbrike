// Registro central dos campos "enumerados" do backend (status, papel, canal…).
// Serve para o admin genérico renderizar dropdown no formulário e badge com
// cor/ícone na listagem, em vez de um campo de texto livre.
//
// Ao adicionar um campo desses num model do backend, registre-o aqui usando a
// chave "colecao.campo" — ou só o nome do campo, para valer em qualquer coleção.

export type EnumTone = 'success' | 'warn' | 'danger' | 'neutral' | 'muted';

export type EnumIcon =
	| 'check'
	| 'clock'
	| 'x'
	| 'pause'
	| 'tag'
	| 'archive'
	| 'star'
	| 'user'
	| 'shield'
	| 'car'
	| 'home'
	| 'box';

export interface EnumOption {
	value: string;
	label: string;
	tone: EnumTone;
	icon: EnumIcon;
}

const LISTING_TYPE_OPTIONS: EnumOption[] = [
	{ value: 'item', label: 'Item', tone: 'neutral', icon: 'box' },
	{ value: 'vehicle', label: 'Veículo', tone: 'neutral', icon: 'car' },
	{ value: 'property', label: 'Imóvel', tone: 'neutral', icon: 'home' }
];

const ENUMS: Record<string, EnumOption[]> = {
	'item.status': [
		{ value: 'active', label: 'Ativo', tone: 'success', icon: 'check' },
		{ value: 'reserved', label: 'Reservado', tone: 'warn', icon: 'clock' },
		{ value: 'sold', label: 'Vendido', tone: 'neutral', icon: 'tag' },
		{ value: 'inactive', label: 'Pausado', tone: 'muted', icon: 'pause' }
	],
	'item.listing_type': LISTING_TYPE_OPTIONS,
	'item.condition': [
		{ value: 'new', label: 'Novo', tone: 'success', icon: 'star' },
		{ value: 'used_like_new', label: 'Usado — como novo', tone: 'neutral', icon: 'check' },
		{ value: 'used_good', label: 'Usado — bom', tone: 'neutral', icon: 'check' },
		{ value: 'used_fair', label: 'Usado — aceitável', tone: 'muted', icon: 'archive' }
	],
	'boost.status': [
		{ value: 'pending', label: 'Pendente', tone: 'warn', icon: 'clock' },
		{ value: 'active', label: 'Ativo', tone: 'success', icon: 'check' },
		{ value: 'rejected', label: 'Recusado', tone: 'danger', icon: 'x' },
		{ value: 'expired', label: 'Expirado', tone: 'muted', icon: 'archive' }
	],
	'item_sale_feedback.channel': [
		{ value: 'platform', label: 'Vendeu na plataforma', tone: 'success', icon: 'check' },
		{ value: 'off_platform', label: 'Vendeu fora', tone: 'warn', icon: 'tag' },
		{ value: 'not_sold', label: 'Não vendeu', tone: 'muted', icon: 'x' }
	],
	'category.listing_type': [
		...LISTING_TYPE_OPTIONS,
		{ value: 'all', label: 'Todos', tone: 'neutral', icon: 'box' }
	],
	'user.role': [
		{ value: 'user', label: 'Usuário', tone: 'neutral', icon: 'user' },
		{ value: 'admin', label: 'Administrador', tone: 'warn', icon: 'shield' }
	],

	// Fallbacks por nome de campo — valem para qualquer coleção nova que use
	// as mesmas convenções do backend.
	status: [
		{ value: 'active', label: 'Ativo', tone: 'success', icon: 'check' },
		{ value: 'pending', label: 'Pendente', tone: 'warn', icon: 'clock' },
		{ value: 'inactive', label: 'Inativo', tone: 'muted', icon: 'pause' }
	],
	listing_type: LISTING_TYPE_OPTIONS
};

/** Opções de um campo enumerado, ou undefined se o campo for texto livre. */
export function getEnumOptions(collectionName: string, fieldKey: string): EnumOption[] | undefined {
	return ENUMS[`${collectionName}.${fieldKey}`] ?? ENUMS[fieldKey];
}

/** Opção correspondente a um valor; cai num fallback neutro se desconhecido. */
export function getEnumOption(
	collectionName: string,
	fieldKey: string,
	value: unknown
): EnumOption | undefined {
	const options = getEnumOptions(collectionName, fieldKey);
	if (!options) return undefined;
	const raw = String(value ?? '');
	return (
		options.find((o) => o.value === raw) ?? { value: raw, label: raw, tone: 'muted', icon: 'tag' }
	);
}
