import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { HelpArticles } from '@/components/help/HelpArticles';
import { SupportRequestForm } from '@/components/help/SupportRequestForm';
import { LEGAL_LINKS, SUPPORT_TOPICS, getHelpArticles } from '@/lib/legal';
import { SITE_URL } from '@/lib/site';
import type { SupportTopic } from '@/lib/services/api';
import { cx, metaClass, panelClass, sectionTitleClass } from '@/lib/ui-classes';

// Perguntas editáveis no admin: renderiza por requisição (fetch com cache curto).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Central de ajuda',
  description: 'Respostas sobre conta, anúncios, segurança, denúncias e privacidade no Fazbrike, e contato com a equipe.',
  alternates: { canonical: `${SITE_URL}/ajuda` },
};

type SearchParams = Promise<{ assunto?: string; anuncio?: string }>;

export default async function HelpCenterPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const articles = await getHelpArticles();
  const initialTopic = SUPPORT_TOPICS.some((topic) => topic.value === params.assunto)
    ? (params.assunto as SupportTopic)
    : undefined;
  const itemId = Number(params.anuncio);

  const faqJsonLd = articles?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: articles.map((article) => ({
          '@type': 'Question',
          name: article.title,
          acceptedAnswer: { '@type': 'Answer', text: article.body },
        })),
      }
    : null;

  return (
    <PageShell width="wide">
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          // JSON.stringify escapa aspas; "<" é trocado para não fechar a tag script.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') }}
        />
      ) : null}

      <PageHeader
        title="Central de ajuda"
        subtitle="Tire suas dúvidas sobre o Fazbrike ou fale com a nossa equipe."
        action={
          <Link href="/ajuda/chamados" className="type-meta font-medium text-ink underline">
            Meus chamados
          </Link>
        }
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-10">
          {articles ? (
            <HelpArticles articles={articles} />
          ) : (
            <div className={cx(panelClass, 'p-6')} role="alert">
              <p className="type-body text-ink font-medium">Não foi possível carregar as perguntas agora.</p>
              <p className={cx(metaClass, 'mt-1')}>Você ainda pode falar com a equipe pelo formulário abaixo.</p>
            </div>
          )}
          <SupportRequestForm initialTopic={initialTopic} itemId={Number.isInteger(itemId) && itemId > 0 ? itemId : undefined} />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className={cx(panelClass, 'p-5')}>
            <h2 className={sectionTitleClass}>Termos e políticas</h2>
            <ul className="mt-3 space-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.slug}>
                  <Link href={link.href} className="type-body text-ink hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className={cx(panelClass, 'p-5')}>
            <h2 className={sectionTitleClass}>Viu algo errado?</h2>
            <p className={cx(metaClass, 'mt-2')}>
              Para denunciar um anúncio, abra a página dele e use o botão <span className="text-ink font-medium">Denunciar</span>.
              Veja o que não é permitido nas{' '}
              <Link href="/regras-de-publicacao" className="underline text-ink">
                Regras de publicação
              </Link>
              .
            </p>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
