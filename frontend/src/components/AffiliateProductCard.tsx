'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  affiliateRedirectUrl,
  resolveImageUrl,
  type AffiliateProduct,
} from '@/lib/services/api';
import { formatPrice } from '@/lib/catalog';

interface AffiliateProductCardProps {
  product: AffiliateProduct;
  compact?: boolean;
}

export function AffiliateProductCard({ product, compact = false }: AffiliateProductCardProps) {
  const initialImage = resolveImageUrl(product.image_url);
  const [imageSrc, setImageSrc] = useState(initialImage);

  useEffect(() => {
    setImageSrc(resolveImageUrl(product.image_url));
  }, [product.image_url]);

  const discount = useMemo(() => {
    if (!product.original_price || product.original_price <= product.price) return 0;
    return Math.round((1 - product.price / product.original_price) * 100);
  }, [product.original_price, product.price]);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card border border-[color:var(--color-border)] bg-surface shadow-card">
      <a
        href={affiliateRedirectUrl(product.id)}
        target="_blank"
        rel="sponsored nofollow noopener noreferrer"
        className="flex h-full flex-col text-ink"
        aria-label={`Ver oferta de ${product.title} em ${product.partner.name}`}
      >
        <div className={`relative overflow-hidden bg-subtle ${compact ? 'aspect-square' : 'aspect-[4/3]'}`}>
          <img
            src={imageSrc}
            alt={product.title}
            className="h-full w-full object-cover object-center transition-transform duration-[var(--motion-fast)] group-hover:scale-[1.03]"
            onError={() => setImageSrc('/placeholder.svg')}
          />
          <div className="absolute left-3 top-3 rounded-pill border border-white/70 bg-surface/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink backdrop-blur-sm">
            Publicidade
          </div>
          {discount > 0 ? (
            <div className="absolute right-3 top-3 rounded-pill bg-ink px-2.5 py-1 text-[11px] font-bold text-white">
              -{discount}%
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            {product.partner.name}
          </p>
          <h3 className="mt-1 line-clamp-2 min-h-10 text-[14px] font-semibold leading-5 text-ink">
            {product.title}
          </h3>
          {!compact && product.description ? (
            <p className="mt-2 line-clamp-2 type-meta text-muted">{product.description}</p>
          ) : null}

          <div className="mt-auto pt-4">
            {product.original_price && product.original_price > product.price ? (
              <p className="text-[12px] leading-4 text-muted line-through">
                {formatPrice(product.original_price)}
              </p>
            ) : null}
            <p className="text-[17px] font-bold leading-6 text-ink">{formatPrice(product.price)}</p>
            {product.coupon_code ? (
              <p className="mt-2 rounded-control border border-dashed border-ink/25 bg-subtle px-2.5 py-1.5 text-[12px] text-ink">
                Cupom: <span className="font-bold">{product.coupon_code}</span>
              </p>
            ) : null}
            <span className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-control bg-ink px-4 type-meta font-semibold text-white transition-colors group-hover:bg-neutral-800">
              Ver oferta
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 17L17 7M8 7h9v9" />
              </svg>
            </span>
          </div>
        </div>
      </a>
    </article>
  );
}
