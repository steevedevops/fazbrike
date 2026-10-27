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
import { containerClass, cx, sectionTitleClass } from '@/lib/ui-classes';

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

const sliderButtonClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-pill border border-white/30 bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink';

export function PromotionSlider({
  promotions,
  loading,
}: {
  promotions: Promotion[];
  loading?: boolean;
}) {
  const open = useOpenPromotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const multiple = promotions.length > 1;

  useEffect(() => {
    setIndex((current) => (current >= promotions.length ? 0 : current));
  }, [promotions.length]);

  useEffect(() => {
    if (!multiple || paused) return;
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % promotions.length);
    }, 6000);
    return () => clearInterval(id);
  }, [multiple, paused, promotions.length]);

  if (loading) {
    return (
      <section className={`${containerClass} pt-5`} aria-hidden>
        <div className="h-[320px] animate-pulse rounded-card bg-subtle" />
      </section>
    );
  }

  if (promotions.length === 0) return null;

  const goTo = (next: number) => {
    setIndex(((next % promotions.length) + promotions.length) % promotions.length);
  };

  return (
    <section
      className={`${containerClass} pt-5`}
      aria-label="Destaque"
      aria-roledescription={multiple ? 'carrossel' : undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-card bg-ink">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {promotions.map((promotion, slideIndex) => {
            const clickable = isClickableTarget(promotion.target);
            return (
              <button
                key={promotion.id}
                type="button"
                onClick={() => open(promotion)}
                disabled={!clickable}
                aria-label={promotionLabel(promotion)}
                aria-hidden={multiple && slideIndex !== index ? true : undefined}
                tabIndex={multiple && slideIndex !== index ? -1 : undefined}
                className={cx(
                  'grid min-w-full shrink-0 text-left md:min-h-[300px] md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]',
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
                <div className="relative h-52 md:h-auto md:min-h-[300px]">
                  <img
                    src={resolveImageUrl(promotion.image_url)}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-center"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {multiple ? (
          <>
            <div className="absolute bottom-4 left-6 flex items-center gap-2 sm:left-10">
              {promotions.map((promotion, dotIndex) => (
                <button
                  key={promotion.id}
                  type="button"
                  onClick={() => goTo(dotIndex)}
                  aria-label={`Ir para a promoção ${dotIndex + 1}`}
                  aria-current={dotIndex === index ? 'true' : undefined}
                  className={cx(
                    'h-2 rounded-pill transition-all',
                    dotIndex === index ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                  )}
                />
              ))}
            </div>
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                aria-label="Promoção anterior"
                className={sliderButtonClass}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                aria-label="Próxima promoção"
                className={sliderButtonClass}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

const railButtonClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-pill border border-[color:var(--color-border)] bg-surface text-ink transition-colors hover:bg-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-40';

export function PromotionRail({ promotions }: { promotions: Promotion[] }) {
  const open = useOpenPromotion();
  const railRef = useRef<HTMLDivElement>(null);

  if (promotions.length === 0) return null;

  const scrollRail = (direction: 1 | -1) => {
    railRef.current?.scrollBy({ left: direction * 336, behavior: 'smooth' });
  };

  return (
    <section className={`${containerClass} pt-10`} aria-label="Promoções">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className={sectionTitleClass}>Promoções</h2>
        {promotions.length > 1 ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollRail(-1)}
              aria-label="Promoções anteriores"
              className={railButtonClass}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollRail(1)}
              aria-label="Próximas promoções"
              className={railButtonClass}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>
      <div
        ref={railRef}
        className="rail-scroll flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2"
      >
        {promotions.map((promotion) => {
          const clickable = isClickableTarget(promotion.target);
          return (
            <div key={promotion.id} className="w-[300px] shrink-0 snap-start sm:w-[320px]">
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
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex min-h-[148px] flex-1 flex-col p-5">
                  <p className="line-clamp-2 text-[16px] font-semibold leading-5 text-ink">
                    {promotion.title}
                  </p>
                  {promotion.subtitle ? (
                    <p className="mt-1 line-clamp-2 type-meta text-muted">{promotion.subtitle}</p>
                  ) : null}
                  {clickable && promotion.cta_label ? (
                    <span className="mt-auto inline-flex w-fit items-center rounded-pill bg-ink px-3 py-1.5 type-meta font-semibold text-white">
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
