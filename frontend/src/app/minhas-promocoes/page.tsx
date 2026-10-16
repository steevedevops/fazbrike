'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { PromotionForm } from '@/components/promotions/PromotionForm';
import { useAuth } from '@/hooks/useAuth';
import {
  apiService,
  resolveImageUrl,
  type Item,
  type MyPromotion,
} from '@/lib/services/api';
import {
  btnGhostClass,
  btnInkClass,
  cx,
  errorBannerClass,
  metaClass,
  panelClass,
  sectionTitleClass,
} from '@/lib/ui-classes';

/** Frase legível do destino, para conferir sem decorar tipos. */
function targetLabel(promotion: MyPromotion): string {
  const label = promotion.target?.label ?? '';
  switch (promotion.target_type) {
    case 'profile':
      return 'Abre a sua loja';
    case 'item':
      return label ? `Abre o anúncio "${label}"` : 'Abre um anúncio seu';
    case 'category':
      return label ? `Abre a categoria ${label}` : 'Abre uma categoria';
    case 'search':
      return `Abre a busca por "${promotion.target_value}"`;
    case 'page':
      return `Abre ${label}`;
    case 'external':
      return 'Abre um site externo';
    default:
      return 'Sem destino';
  }
}

export default function MyPromotionsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [promotions, setPromotions] = useState<MyPromotion[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [maxActive, setMaxActive] = useState(2);
  const [editing, setEditing] = useState<MyPromotion | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [mine, myItems] = await Promise.all([
        apiService.getMyPromotions(),
        apiService.get<Item[]>('/items/my'),
      ]);
      setPromotions(mine.results);
      setMaxActive(mine.max_active);
      setItems(myItems || []);
      setError('');
    } catch (err) {
      setError((err as Error)?.message || 'Não foi possível carregar suas campanhas.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (promotion: MyPromotion) => {
    try {
      await apiService.setPromotionActive(promotion.id, !promotion.is_active);
      load();
    } catch (err) {
      setError((err as Error)?.message || 'Não foi possível alterar a campanha.');
    }
  };

  const remove = async (promotion: MyPromotion) => {
    if (!window.confirm(`Excluir a campanha "${promotion.title}"?`)) return;
    try {
      await apiService.deletePromotion(promotion.id);
      load();
    } catch (err) {
      setError((err as Error)?.message || 'Não foi possível excluir a campanha.');
    }
  };

  const closeEditor = () => {
    setEditing(null);
    setCreating(false);
  };

  const showEditor = creating || editing !== null;

  return (
    <PageShell width="narrow">
      <PageHeader
        title="Minhas promoções"
        subtitle={`Banners que aparecem na home do app e do site. Você pode manter até ${maxActive} no ar ao mesmo tempo.`}
        action={
          showEditor ? null : (
            <button type="button" onClick={() => setCreating(true)} className={btnInkClass}>
              Nova campanha
            </button>
          )
        }
      />

      {error ? <div className={errorBannerClass} role="alert">{error}</div> : null}

      {showEditor ? (
        <div className={`${panelClass} p-6`}>
          <p className={`${sectionTitleClass} mb-5`}>
            {editing ? 'Editar campanha' : 'Nova campanha'}
          </p>
          <PromotionForm
            promotion={editing}
            items={items}
            onSaved={() => {
              closeEditor();
              load();
            }}
            onCancel={closeEditor}
          />
        </div>
      ) : loading ? (
        <p className={metaClass}>Carregando…</p>
      ) : promotions.length === 0 ? (
        <EmptyState
          title="Nenhuma campanha ainda"
          description="Crie um banner para aparecer na home e levar quem clica direto para a sua loja."
          action={
            <button type="button" onClick={() => setCreating(true)} className={btnInkClass}>
              Criar campanha
            </button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {promotions.map((promotion) => (
            <article key={promotion.id} className={`${panelClass} overflow-hidden`}>
              <div className="relative h-32 bg-subtle sm:h-36">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveImageUrl(promotion.image_url)}
                  alt=""
                  className="h-full w-full object-cover object-center"
                />
                <span
                  className={cx(
                    'absolute left-3 top-3 rounded-pill px-2.5 py-1 text-[11px] font-bold text-white',
                    // Tokens do design system do site (não existe --color-warning aqui).
                    promotion.is_visible ? 'bg-success' : promotion.is_active ? 'bg-ink' : 'bg-muted'
                  )}
                >
                  {promotion.is_visible ? 'No ar' : promotion.is_active ? 'Fora do ar' : 'Desativado'}
                </span>
              </div>

              <div className="p-5">
                <p className="type-title text-ink">{promotion.title}</p>
                <p className={`${metaClass} mt-1`}>{targetLabel(promotion)}</p>

                {promotion.unavailable_for ? (
                  <p className="mt-3 rounded-control bg-red-50 p-3 type-meta text-danger">
                    {promotion.unavailable_for}
                  </p>
                ) : null}

                <p className={`${metaClass} mt-3`}>
                  {promotion.impression_count} exibições · {promotion.click_count} cliques
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" onClick={() => setEditing(promotion)} className={btnGhostClass}>
                    Editar
                  </button>
                  <button type="button" onClick={() => toggleActive(promotion)} className={btnGhostClass}>
                    {promotion.is_active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button type="button" onClick={() => remove(promotion)} className={btnGhostClass}>
                    Excluir
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
