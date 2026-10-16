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
		{ value: 'pending', label: 'Aguardando análise', tone: 'warn', icon: 'clock' },
		{ value: 'rejected', label: 'Rejeitado', tone: 'danger', icon: 'x' },
		{ value: 'reserved', label: 'Reservado', tone: 'warn', icon: 'clock' },
		{ value: 'sold', label: 'Vendido', tone: 'neutral', icon: 'tag' },
		{ value: 'inactive', label: 'Pausado', tone: 'muted', icon: 'pause' }
	],
	'item_report.status': [
		{ value: 'open', label: 'Aberta', tone: 'warn', icon: 'clock' },
		{ value: 'resolved', label: 'Resolvida', tone: 'success', icon: 'check' },
		{ value: 'dismissed', label: 'Descartada', tone: 'muted', icon: 'x' }
	],
	'item_report.reason': [
		{ value: 'prohibited_item', label: 'Produto proibido', tone: 'danger', icon: 'shield' },
		{ value: 'fraud', label: 'Suspeita de fraude', tone: 'danger', icon: 'shield' },
		{ value: 'misleading', label: 'Informações enganosas', tone: 'warn', icon: 'tag' },
		{ value: 'duplicate', label: 'Anúncio duplicado', tone: 'neutral', icon: 'archive' },
		{ value: 'offensive', label: 'Conteúdo ofensivo', tone: 'danger', icon: 'x' },
		{ value: 'other', label: 'Outro motivo', tone: 'muted', icon: 'tag' }
	],
	'help_article.category': [
		{ value: 'conta', label: 'Conta e acesso', tone: 'neutral', icon: 'user' },
		{ value: 'anuncios', label: 'Anúncios', tone: 'neutral', icon: 'tag' },
		{ value: 'compras', label: 'Compras e negociação', tone: 'neutral', icon: 'box' },
		{ value: 'seguranca', label: 'Segurança', tone: 'neutral', icon: 'shield' },
		{ value: 'denuncias', label: 'Denúncias', tone: 'neutral', icon: 'shield' },
		{ value: 'privacidade', label: 'Privacidade e dados', tone: 'neutral', icon: 'shield' }
	],
	'support_request.topic': [
		{ value: 'conta', label: 'Minha conta', tone: 'neutral', icon: 'user' },
		{ value: 'anuncio', label: 'Anúncio', tone: 'neutral', icon: 'tag' },
		{ value: 'compra', label: 'Compra ou negociação', tone: 'neutral', icon: 'box' },
		{ value: 'denuncia', label: 'Denúncia', tone: 'warn', icon: 'shield' },
		{ value: 'privacidade', label: 'Privacidade e dados', tone: 'warn', icon: 'shield' },
		{ value: 'exclusao_conta', label: 'Excluir minha conta', tone: 'danger', icon: 'x' },
		{ value: 'outro', label: 'Outro assunto', tone: 'muted', icon: 'tag' }
	],
	'support_request.status': [
		{ value: 'open', label: 'Aberto', tone: 'warn', icon: 'clock' },
		{ value: 'answered', label: 'Respondido', tone: 'success', icon: 'check' },
		{ value: 'closed', label: 'Encerrado', tone: 'muted', icon: 'archive' }
	],
	'item.listing_type': LISTING_TYPE_OPTIONS,
	'item.condition': [
		{ value: 'new', label: 'Novo', tone: 'success', icon: 'star' },
		{ value: 'used_like_new', label: 'Usado — como novo', tone: 'neutral', icon: 'check' },
		{ value: 'used_good', label: 'Usado — bom', tone: 'neutral', icon: 'check' },
		{ value: 'used_fair', label: 'Usado — aceitável', tone: 'muted', icon: 'archive' }
	],
	'promotion.target_type': [
		{ value: 'profile', label: 'Perfil do anunciante', tone: 'neutral', icon: 'user' },
		{ value: 'item', label: 'Anúncio do anunciante', tone: 'neutral', icon: 'tag' },
		{ value: 'category', label: 'Categoria', tone: 'neutral', icon: 'box' },
		{ value: 'search', label: 'Busca por termo', tone: 'neutral', icon: 'box' },
		{ value: 'page', label: 'Página da plataforma', tone: 'neutral', icon: 'home' },
		{ value: 'external', label: 'Link externo', tone: 'warn', icon: 'shield' }
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
