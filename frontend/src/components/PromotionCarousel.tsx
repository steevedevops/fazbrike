'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  apiService,
  isClickableTarget,
  isInternalTarget,
  resolveImageUrl,
  type Promotion,
} from '@/lib/services/api';
import { containerClass, cx } from '@/lib/ui-classes';

/**
 * Campanhas da home. O destino já vem resolvido do backend, então o
 * clique navega dentro do próprio site, nas mesmas rotas que o app usa.
 */
export function useHomePromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const counted = useRef(false);

  useEffect(() => {
    let alive = true;
    apiService
      .getPromotions()
      .then((data) => {
        if (!alive) return;
        setPromotions(data);
        if (!counted.current && data.length > 0) {
          counted.current = true;
          apiService.registerPromotionImpressions(data.map((promotion) => promotion.id));
        }
      })
      .catch(() => {
        if (alive) setPromotions([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { promotions, loading };
}

function useOpenPromotion() {
  const router = useRouter();

  return useCallback(
    async (promotion: Promotion) => {
      if (!isClickableTarget(promotion.target)) return;
      const confirmed = await apiService.clickPromotion(promotion.id);
      const target = confirmed ?? promotion.target;

      if (isInternalTarget(target)) {
        router.push(target.route!);
        return;
      }
      if (target.external_url) {
        window.open(target.external_url, '_blank', 'noopener,noreferrer');
      }
    },
    [router]
  );
}

function promotionLabel(promotion: Promotion) {
  return promotion.target.label
    ? `${promotion.title}, abre ${promotion.target.label}`
    : promotion.title;
}

export function PromotionHero({
  promotion,
  loading,
}: {
  promotion?: Promotion;
  loading?: boolean;
}) {
  const open = useOpenPromotion();

  if (loading) {
    return (
      <section className={`${containerClass} pt-5`} aria-hidden>
        <div className="h-[260px] animate-pulse rounded-card bg-subtle" />
      </section>
    );
  }

  if (!promotion) return null;

  const clickable = isClickableTarget(promotion.target);

  return (
    <section className={`${containerClass} pt-5`} aria-label="Destaque">
      <button
        type="button"
        onClick={() => open(promotion)}
        disabled={!clickable}
        aria-label={promotionLabel(promotion)}
        className={cx(
          'grid w-full overflow-hidden rounded-card bg-ink text-left md:min-h-[260px] md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]',
          clickable ? 'cursor-pointer' : 'cursor-default'
        )}
      >
        <div className="flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-12">
          <p className="type-display max-w-xl text-white">{promotion.title}</p>
          {promotion.subtitle ? (
            <p className="type-body mt-2 max-w-lg text-white/80">{promotion.subtitle}</p>
          ) : null}
          {clickable && promotion.cta_label ? (
            <span className="mt-6 inline-flex w-fit items-center rounded-pill border border-white/70 bg-white/10 px-4 py-2 type-meta font-semibold text-white">
              {promotion.cta_label}
            </span>
          ) : null}
        </div>
        <div className="relative h-44 md:h-auto md:min-h-[260px]">
          <img
            src={resolveImageUrl(promotion.image_url)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </div>
      </button>
    </section>
  );
}

export function PromotionRail({ promotions }: { promotions: Promotion[] }) {
  const open = useOpenPromotion();

  if (promotions.length === 0) return null;

  return (
    <section className={`${containerClass} pt-10`} aria-label="Promoções">
      <div className="rail-scroll flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
        {promotions.map((promotion) => {
          const clickable = isClickableTarget(promotion.target);
          return (
            <div key={promotion.id} className="w-[280px] shrink-0 snap-start">
              <button
                type="button"
                onClick={() => open(promotion)}
                disabled={!clickable}
                aria-label={promotionLabel(promotion)}
                className={cx(
                  'flex h-full w-full flex-col overflow-hidden rounded-card border border-[color:var(--color-border)] bg-surface text-left shadow-card',
                  clickable ? 'cursor-pointer' : 'cursor-default'
                )}
              >
                <div className="relative aspect-[4/3] bg-subtle">
                  <img
                    src={resolveImageUrl(promotion.image_url)}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-center"
                  />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="line-clamp-2 text-[16px] font-semibold leading-5 text-ink">
                    {promotion.title}
                  </p>
                  {promotion.subtitle ? (
                    <p className="mt-1 line-clamp-2 type-meta text-muted">{promotion.subtitle}</p>
                  ) : null}
                  {clickable && promotion.cta_label ? (
                    <span className="mt-4 inline-flex w-fit items-center rounded-pill bg-ink px-3 py-1.5 type-meta font-semibold text-white">
                      {promotion.cta_label}
                    </span>
                  ) : null}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
