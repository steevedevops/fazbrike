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
 * Banners de campanha da home. O destino já vem resolvido do backend, então o
 * clique navega dentro do próprio site — as mesmas rotas que o app usa.
 */
export function PromotionCarousel() {
  const router = useRouter();
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

  const open = useCallback(
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

  if (loading || promotions.length === 0) return null;

  return (
    <section className={`${containerClass} pt-6`} aria-label="Promoções">
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:thin]">
        {promotions.map((promotion) => {
          const clickable = isClickableTarget(promotion.target);
          return (
            <div
              key={promotion.id}
              className="w-[calc(100%-1rem)] shrink-0 snap-start sm:w-[520px]"
            >
              <button
                type="button"
                onClick={() => open(promotion)}
                disabled={!clickable}
                aria-label={
                  promotion.target.label
                    ? `${promotion.title} — abre ${promotion.target.label}`
                    : promotion.title
                }
                className={cx(
                  'relative block h-[200px] w-full overflow-hidden rounded-card text-left sm:h-[220px]',
                  clickable ? 'cursor-pointer' : 'cursor-default'
                )}
              >
                <img
                  src={resolveImageUrl(promotion.image_url)}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
                {/* Véu fixo: garante contraste do texto sobre qualquer arte. */}
                <div className="absolute inset-0 bg-ink/55" />
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <p className="type-title text-white">{promotion.title}</p>
                  {promotion.subtitle ? (
                    <p className="type-meta mt-1 text-white/80">{promotion.subtitle}</p>
                  ) : null}
                  {clickable && promotion.cta_label ? (
                    <span className="mt-4 inline-flex w-fit items-center rounded-pill bg-brand-500 px-4 py-1.5 type-meta font-semibold text-white">
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
