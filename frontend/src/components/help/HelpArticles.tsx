'use client';

import React, { useMemo, useState } from 'react';
import type { HelpArticle } from '@/lib/services/api';
import { HELP_CATEGORIES } from '@/lib/legal';
import { chipActiveClass, chipClass, cx, fieldClass, metaClass, panelClass } from '@/lib/ui-classes';
import { EmptyState } from '@/components/layout/EmptyState';

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export function HelpArticles({ articles }: { articles: HelpArticle[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('');

  const categories = useMemo(
    () => HELP_CATEGORIES.filter((option) => articles.some((article) => article.category === option.value)),
    [articles]
  );

  const filtered = useMemo(() => {
    const term = normalize(query.trim());
    return articles.filter((article) => {
      if (category && article.category !== category) return false;
      if (!term) return true;
      return normalize(`${article.title} ${article.body}`).includes(term);
    });
  }, [articles, category, query]);

  const grouped = useMemo(
    () =>
      HELP_CATEGORIES.map((option) => ({
        ...option,
        items: filtered.filter((article) => article.category === option.value),
      })).filter((group) => group.items.length > 0),
    [filtered]
  );

  return (
    <section aria-labelledby="faq-title">
      <h2 id="faq-title" className="sr-only">
        Perguntas frequentes
      </h2>
      <label htmlFor="help-search" className="sr-only">
        Buscar na central de ajuda
      </label>
      <input
        id="help-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Busque por uma dúvida: senha, denúncia, excluir conta..."
        className={fieldClass}
        autoComplete="off"
      />

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por tema">
        <button
          type="button"
          className={category === '' ? chipActiveClass : chipClass}
          aria-pressed={category === ''}
          onClick={() => setCategory('')}
        >
          Todos os temas
        </button>
        {categories.map((option) => (
          <button
            key={option.value}
            type="button"
            className={category === option.value ? chipActiveClass : chipClass}
            aria-pressed={category === option.value}
            onClick={() => setCategory(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-8">
        {grouped.length === 0 ? (
          <EmptyState
            title="Nenhuma resposta encontrada"
            description="Tente outras palavras ou fale com a nossa equipe pelo formulário abaixo."
          />
        ) : (
          grouped.map((group) => (
            <div key={group.value}>
              <h3 className="type-meta font-semibold uppercase tracking-wide text-ink mb-3">{group.label}</h3>
              <div className={cx(panelClass, 'divide-y divide-[color:var(--color-border)]')}>
                {group.items.map((article) => (
                  <details key={article.id} className="group px-5 py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 type-body font-medium text-ink">
                      <span className="min-w-0">{article.title}</span>
                      <svg
                        className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <p className={cx(metaClass, 'mt-3 whitespace-pre-line leading-relaxed')}>{article.body}</p>
                  </details>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
