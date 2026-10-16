import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/PageShell';
import { SITE_URL } from '@/lib/site';
import {
  LEGAL_LINKS,
  formatLegalDate,
  getLegalDocument,
  parseLegalContent,
  type LegalSlug,
} from '@/lib/legal';
import { cx, metaClass, pageLeadClass, pageTitleClass, panelClass } from '@/lib/ui-classes';

export async function legalMetadata(slug: LegalSlug): Promise<Metadata> {
  const document = await getLegalDocument(slug);
  const fallback = LEGAL_LINKS.find((link) => link.slug === slug)?.label ?? 'Documento';
  return {
    title: document?.title ?? fallback,
    description: document?.summary || undefined,
    alternates: { canonical: `${SITE_URL}/${slug}` },
  };
}

export async function LegalDocumentPage({ slug }: { slug: LegalSlug }) {
  const document = await getLegalDocument(slug);
  const blocks = document ? parseLegalContent(document.content) : [];
  const updatedAt = document ? formatLegalDate(document.updated_at) : '';

  return (
    <PageShell width="wide">
      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Documentos" className="lg:sticky lg:top-24 lg:self-start">
          <p className="type-meta font-semibold uppercase tracking-wide text-ink mb-3">Termos e políticas</p>
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {LEGAL_LINKS.map((link) => {
              const active = link.slug === slug;
              return (
                <li key={link.slug}>
                  <Link
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={cx(
                      'block rounded-control px-3 py-2 type-meta font-medium',
                      active ? 'bg-ink text-white' : 'text-muted hover:text-ink hover:bg-subtle'
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link href="/ajuda" className="block rounded-control px-3 py-2 type-meta font-medium text-muted hover:text-ink hover:bg-subtle">
                Central de ajuda
              </Link>
            </li>
          </ul>
        </nav>

        <article className="min-w-0 max-w-3xl">
          {document ? (
            <>
              <header className="mb-8">
                <h1 className={pageTitleClass}>{document.title}</h1>
                {document.summary ? <p className={pageLeadClass}>{document.summary}</p> : null}
                <p className={cx(metaClass, 'mt-3')}>
                  Versão {document.version}
                  {updatedAt ? ` · Atualizado em ${updatedAt}` : ''}
                </p>
              </header>
              <div className="space-y-4 type-body text-ink">
                {blocks.map((block, index) => {
                  if (block.kind === 'heading') {
                    return (
                      <h2 key={index} className="type-title text-ink pt-4">
                        {block.text}
                      </h2>
                    );
                  }
                  if (block.kind === 'list') {
                    return (
                      <ul key={index} className="list-disc space-y-1.5 pl-5 text-ink/90">
                        {block.items.map((item, itemIndex) => (
                          <li key={itemIndex}>{item}</li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <p key={index} className="text-ink/90 leading-relaxed">
                      {block.text}
                    </p>
                  );
                })}
              </div>
              <div className={cx(panelClass, 'mt-10 p-5')}>
                <p className="type-body text-ink font-medium">Ficou alguma dúvida?</p>
                <p className={cx(metaClass, 'mt-1')}>
                  Fale com a equipe pela{' '}
                  <Link href="/ajuda#contato" className="underline text-ink">
                    Central de ajuda
                  </Link>
                  .
                </p>
              </div>
            </>
          ) : (
            <div className={cx(panelClass, 'p-6')} role="alert">
              <h1 className="type-title text-ink">Documento indisponível no momento</h1>
              <p className={cx(metaClass, 'mt-2')}>
                Não conseguimos carregar este documento agora. Tente novamente em instantes ou fale com a gente pela{' '}
                <Link href="/ajuda#contato" className="underline text-ink">
                  Central de ajuda
                </Link>
                .
              </p>
            </div>
          )}
        </article>
      </div>
    </PageShell>
  );
}
