import { API_URL } from '@/lib/site';
import type { HelpArticle, LegalDocument, SupportTopic } from '@/lib/services/api';

// Rotas públicas dos documentos legais. O slug é o mesmo do backend
// (models.LegalSlug*) e a rota do site repete o slug para ficar estável —
// estas URLs vão para as lojas de apps e para o cadastro.
export const LEGAL_LINKS = [
  { slug: 'termos-de-uso', href: '/termos-de-uso', label: 'Termos de uso' },
  { slug: 'politica-de-privacidade', href: '/politica-de-privacidade', label: 'Política de privacidade' },
  { slug: 'regras-de-publicacao', href: '/regras-de-publicacao', label: 'Regras de publicação' },
  { slug: 'politica-de-cookies', href: '/politica-de-cookies', label: 'Política de cookies' },
] as const;

export type LegalSlug = (typeof LEGAL_LINKS)[number]['slug'];

export const HELP_CATEGORIES: { value: HelpArticle['category']; label: string }[] = [
  { value: 'conta', label: 'Conta e acesso' },
  { value: 'anuncios', label: 'Anúncios' },
  { value: 'compras', label: 'Compras e negociação' },
  { value: 'seguranca', label: 'Segurança' },
  { value: 'denuncias', label: 'Denúncias' },
  { value: 'privacidade', label: 'Privacidade e dados' },
];

export const SUPPORT_TOPICS: { value: SupportTopic; label: string }[] = [
  { value: 'conta', label: 'Minha conta' },
  { value: 'anuncio', label: 'Anúncio (incluindo contestar retirada)' },
  { value: 'compra', label: 'Compra ou negociação' },
  { value: 'denuncia', label: 'Denúncia' },
  { value: 'privacidade', label: 'Privacidade e dados (LGPD)' },
  { value: 'exclusao_conta', label: 'Excluir minha conta' },
  { value: 'outro', label: 'Outro assunto' },
];

// Busca no servidor (sem axios, que é client-only). Os textos mudam pouco:
// cache curto evita bater no backend a cada visita.
export async function getLegalDocument(slug: LegalSlug): Promise<LegalDocument | null> {
  try {
    const res = await fetch(`${API_URL}/legal/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()) as LegalDocument;
  } catch {
    return null;
  }
}

export async function getHelpArticles(): Promise<HelpArticle[] | null> {
  try {
    const res = await fetch(`${API_URL}/help/articles`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: HelpArticle[] };
    return data.results ?? [];
  } catch {
    return null;
  }
}

export type LegalBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] };

// Converte o markdown simples dos documentos ("## " seção, "- " item, linha
// em branco entre parágrafos) em blocos. Texto é sempre renderizado como
// texto puro — nada de HTML vindo do banco.
export function parseLegalContent(content: string): LegalBlock[] {
  const blocks: LegalBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flush = () => {
    if (paragraph.length) blocks.push({ kind: 'paragraph', text: paragraph.join(' ') });
    if (list.length) blocks.push({ kind: 'list', items: list });
    paragraph = [];
    list = [];
  };

  for (const raw of content.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim();
    if (!line) {
      flush();
    } else if (line.startsWith('#')) {
      flush();
      blocks.push({ kind: 'heading', text: line.replace(/^#+\s*/, '') });
    } else if (line.startsWith('- ')) {
      if (paragraph.length) {
        blocks.push({ kind: 'paragraph', text: paragraph.join(' ') });
        paragraph = [];
      }
      list.push(line.slice(2).trim());
    } else {
      if (list.length) {
        blocks.push({ kind: 'list', items: list });
        list = [];
      }
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}

export function formatLegalDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}
