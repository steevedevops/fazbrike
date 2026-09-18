export type ListingType = 'item' | 'vehicle' | 'property';

export type CategoryNode = {
  slug: string;
  name: string;
  listing_type?: ListingType | 'all' | string;
  icon?: string;
  children?: CategoryNode[];
  parent_id?: number | null;
  id?: number;
};

/** Fallback alinhado ao seed do backend (Marketplace BR). */
export const CATEGORIES: CategoryNode[] = [
  {
    slug: 'veiculos',
    name: 'Veículos',
    listing_type: 'vehicle',
    icon: 'veiculos',
    children: [
      { slug: 'carros', name: 'Carros', listing_type: 'vehicle' },
      { slug: 'motos', name: 'Motos', listing_type: 'vehicle' },
      { slug: 'barcos', name: 'Barcos', listing_type: 'vehicle' },
      { slug: 'outros-veiculos', name: 'Outros veículos', listing_type: 'vehicle' },
    ],
  },
  {
    slug: 'locacao-imoveis',
    name: 'Locação de imóveis',
    listing_type: 'property',
    icon: 'imoveis',
    children: [
      { slug: 'apartamento-aluguel', name: 'Apartamento', listing_type: 'property' },
      { slug: 'casa-aluguel', name: 'Casa', listing_type: 'property' },
      { slug: 'quarto-aluguel', name: 'Quarto', listing_type: 'property' },
    ],
  },
  {
    slug: 'imoveis',
    name: 'Venda de imóveis',
    listing_type: 'property',
    icon: 'imoveis',
    children: [
      { slug: 'apartamento-venda', name: 'Apartamento', listing_type: 'property' },
      { slug: 'casa-venda', name: 'Casa', listing_type: 'property' },
      { slug: 'terreno', name: 'Terreno', listing_type: 'property' },
    ],
  },
  {
    slug: 'eletronicos',
    name: 'Eletrônicos',
    listing_type: 'item',
    icon: 'eletronicos',
    children: [
      { slug: 'celulares', name: 'Celulares', listing_type: 'item' },
      { slug: 'computadores', name: 'Computadores', listing_type: 'item' },
      { slug: 'tvs-audio', name: 'TVs e áudio', listing_type: 'item' },
      { slug: 'acessorios-eletronicos', name: 'Acessórios', listing_type: 'item' },
    ],
  },
  {
    slug: 'roupas',
    name: 'Roupas e acessórios',
    listing_type: 'item',
    icon: 'roupas',
    children: [
      { slug: 'roupas-masculinas', name: 'Masculino', listing_type: 'item' },
      { slug: 'roupas-femininas', name: 'Feminino', listing_type: 'item' },
      { slug: 'roupas-infantis', name: 'Infantil', listing_type: 'item' },
      { slug: 'calcados', name: 'Calçados', listing_type: 'item' },
    ],
  },
  { slug: 'moveis', name: 'Móveis e casa', listing_type: 'item', icon: 'moveis' },
  { slug: 'eletrodomesticos', name: 'Eletrodomésticos', listing_type: 'item', icon: 'eletronicos' },
  { slug: 'jardinagem', name: 'Jardim e área externa', listing_type: 'item', icon: 'outros' },
  { slug: 'esportes', name: 'Artigos esportivos', listing_type: 'item', icon: 'esportes' },
  { slug: 'brinquedos', name: 'Brinquedos e jogos', listing_type: 'item', icon: 'outros' },
  { slug: 'familia', name: 'Família e bebê', listing_type: 'item', icon: 'outros' },
  { slug: 'hobbies', name: 'Hobbies', listing_type: 'item', icon: 'outros' },
  { slug: 'instrumentos-musicais', name: 'Instrumentos musicais', listing_type: 'item', icon: 'outros' },
  { slug: 'escritorio', name: 'Material de escritório', listing_type: 'item', icon: 'outros' },
  { slug: 'pets', name: 'Artigos para pets', listing_type: 'item', icon: 'outros' },
  { slug: 'entretenimento', name: 'Entretenimento', listing_type: 'item', icon: 'outros' },
  { slug: 'construcao', name: 'Melhorias para casa', listing_type: 'item', icon: 'outros' },
  { slug: 'pecas-auto', name: 'Peças automotivas', listing_type: 'item', icon: 'veiculos' },
  { slug: 'joias', name: 'Joias e relógios', listing_type: 'item', icon: 'outros' },
  { slug: 'beleza', name: 'Saúde e beleza', listing_type: 'item', icon: 'outros' },
  { slug: 'antiguidades', name: 'Antiguidades e colecionáveis', listing_type: 'item', icon: 'outros' },
  { slug: 'artesanato', name: 'Artes e artesanato', listing_type: 'item', icon: 'outros' },
  { slug: 'classificados', name: 'Classificados', listing_type: 'item', icon: 'outros' },
  { slug: 'gratis', name: 'Itens grátis', listing_type: 'item', icon: 'outros' },
  { slug: 'outros', name: 'Outros', listing_type: 'item', icon: 'outros' },
];

export const LISTING_TYPES: { value: ListingType; label: string; hint: string }[] = [
  { value: 'item', label: 'Item para venda', hint: 'Objetos, eletrônicos, móveis, roupas…' },
  { value: 'vehicle', label: 'Veículo para venda', hint: 'Carros, motos, barcos…' },
  { value: 'property', label: 'Imóvel', hint: 'Venda ou locação residencial' },
];

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  flattenCategories(CATEGORIES).map((category) => [category.slug, category.name])
);

export const CONDITIONS = [
  { value: 'new', label: 'Novo' },
  { value: 'used_like_new', label: 'Usado — como novo' },
  { value: 'used_good', label: 'Usado — bom' },
  { value: 'used_fair', label: 'Usado — aceitável' },
] as const;

export const CONDITION_LABELS: Record<string, string> = Object.fromEntries(
  CONDITIONS.map((condition) => [condition.value, condition.label])
);

export function flattenCategories(nodes: CategoryNode[]): CategoryNode[] {
  const out: CategoryNode[] = [];
  for (const n of nodes) {
    out.push(n);
    if (n.children?.length) out.push(...flattenCategories(n.children));
  }
  return out;
}

export function topLevelCategories(nodes: CategoryNode[] = CATEGORIES): CategoryNode[] {
  return nodes.filter((n) => !n.parent_id);
}

export function categoriesForListingType(
  listingType: ListingType | '',
  nodes: CategoryNode[] = CATEGORIES
): CategoryNode[] {
  if (!listingType) return nodes;
  return nodes.filter(
    (n) => !n.listing_type || n.listing_type === listingType || n.listing_type === 'all'
  );
}

export function findCategory(
  slug: string,
  nodes: CategoryNode[] = CATEGORIES
): CategoryNode | undefined {
  for (const n of nodes) {
    if (n.slug === slug) return n;
    if (n.children?.length) {
      const found = findCategory(slug, n.children);
      if (found) return found;
    }
  }
  return undefined;
}

export function parentOfSlug(
  slug: string,
  nodes: CategoryNode[] = CATEGORIES
): CategoryNode | undefined {
  for (const n of nodes) {
    if (n.children?.some((c) => c.slug === slug)) return n;
    if (n.children?.length) {
      const found = parentOfSlug(slug, n.children);
      if (found) return found;
    }
  }
  return undefined;
}

export function categoryIconSlug(slug?: string | null, nodes: CategoryNode[] = CATEGORIES): string {
  const cat = slug ? findCategory(slug, nodes) : undefined;
  if (cat?.icon) return cat.icon;
  const parent = slug ? parentOfSlug(slug, nodes) : undefined;
  if (parent?.icon) return parent.icon;
  if (slug && ['eletronicos', 'moveis', 'roupas', 'veiculos', 'imoveis', 'esportes', 'outros'].includes(slug)) {
    return slug;
  }
  return 'outros';
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function parsePriceInput(raw: string): number | null {
  const normalized = raw.trim().replace(/\s/g, '').replace(',', '.');
  if (!normalized) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

export function categoryLabel(slug?: string | null): string {
  if (!slug) return '';
  return CATEGORY_LABELS[slug] || slug;
}

export function conditionLabel(value?: string | null): string {
  if (!value) return '';
  return CONDITION_LABELS[value] || value;
}

export const CATEGORY_COVERS: Record<string, string> = {
  eletronicos: '/categories/eletronicos.jpg',
  celulares: '/categories/eletronicos.jpg',
  computadores: '/categories/eletronicos.jpg',
  'tvs-audio': '/categories/eletronicos.jpg',
  'acessorios-eletronicos': '/categories/eletronicos.jpg',
  eletrodomesticos: '/categories/eletronicos.jpg',
  moveis: '/categories/moveis.jpg',
  roupas: '/categories/roupas.jpg',
  'roupas-masculinas': '/categories/roupas.jpg',
  'roupas-femininas': '/categories/roupas.jpg',
  'roupas-infantis': '/categories/roupas.jpg',
  calcados: '/categories/roupas.jpg',
  veiculos: '/categories/veiculos.jpg',
  carros: '/categories/veiculos.jpg',
  motos: '/categories/veiculos.jpg',
  barcos: '/categories/veiculos.jpg',
  'outros-veiculos': '/categories/veiculos.jpg',
  'pecas-auto': '/categories/veiculos.jpg',
  imoveis: '/categories/imoveis.jpg',
  'locacao-imoveis': '/categories/imoveis.jpg',
  'apartamento-aluguel': '/categories/imoveis.jpg',
  'casa-aluguel': '/categories/imoveis.jpg',
  'quarto-aluguel': '/categories/imoveis.jpg',
  'apartamento-venda': '/categories/imoveis.jpg',
  'casa-venda': '/categories/imoveis.jpg',
  terreno: '/categories/imoveis.jpg',
  esportes: '/categories/esportes.jpg',
  outros: '/categories/outros.jpg',
  jardinagem: '/categories/outros.jpg',
  brinquedos: '/categories/outros.jpg',
  familia: '/categories/outros.jpg',
  hobbies: '/categories/outros.jpg',
  'instrumentos-musicais': '/categories/outros.jpg',
  escritorio: '/categories/outros.jpg',
  pets: '/categories/outros.jpg',
  entretenimento: '/categories/outros.jpg',
  construcao: '/categories/outros.jpg',
  joias: '/categories/outros.jpg',
  beleza: '/categories/outros.jpg',
  antiguidades: '/categories/outros.jpg',
  artesanato: '/categories/outros.jpg',
  classificados: '/categories/outros.jpg',
  gratis: '/categories/outros.jpg',
};

export function categoryCover(slug?: string | null): string {
  if (!slug) return CATEGORY_COVERS.outros;
  if (CATEGORY_COVERS[slug]) return CATEGORY_COVERS[slug];
  const parent = parentOfSlug(slug);
  if (parent && CATEGORY_COVERS[parent.slug]) return CATEGORY_COVERS[parent.slug];
  const icon = categoryIconSlug(slug);
  if (CATEGORY_COVERS[icon]) return CATEGORY_COVERS[icon];
  return CATEGORY_COVERS.outros;
}

/** Resolve listing image: blank/missing → category cover (old behavior). */
export function listingImageSrc(
  imageUrl?: string | null,
  category?: string | null
): string {
  const raw = (imageUrl || '').trim();
  if (!raw) return categoryCover(category);
  return raw;
}

export type VehicleAttrs = {
  brand?: string;
  model?: string;
  year?: string;
  mileage?: string;
  transmission?: string;
};

export type PropertyAttrs = {
  property_type?: string;
  bedrooms?: string;
  bathrooms?: string;
  area_m2?: string;
  furnished?: string;
  pets_allowed?: string;
  listing_mode?: 'sale' | 'rent' | string;
};

export function parseAttrs<T = Record<string, string>>(raw?: string | null): T {
  if (!raw) return {} as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return {} as T;
  }
}

export function stringifyAttrs(attrs: Record<string, string | undefined>): string {
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (v != null && String(v).trim() !== '') clean[k] = String(v).trim();
  }
  return JSON.stringify(clean);
}
