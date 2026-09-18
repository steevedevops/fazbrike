'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { resolveImageUrl } from '@/lib/services/api';
import { categoryCover, formatPrice, listingImageSrc } from '@/lib/catalog';

export interface ProductTileProps {
  id: number;
  price: number;
  name: string;
  imageUrl?: string;
  category?: string;
  location?: string;
  viewsCount?: number;
}

export function ProductTile({ id, price, name, imageUrl, category, location, viewsCount = 0 }: ProductTileProps) {
  const cover = categoryCover(category);
  const initial = listingImageSrc(imageUrl, category);
  const resolved = initial === cover ? cover : resolveImageUrl(initial);
  const [src, setSrc] = useState(resolved);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const next = listingImageSrc(imageUrl, category);
    setSrc(next === cover ? cover : resolveImageUrl(next));
    setFailed(false);
  }, [imageUrl, category, cover]);

  return (
    <Link
      href={`/produto/${id}`}
      className="group relative block h-full min-h-[160px] overflow-hidden rounded-card bg-subtle"
    >
      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center text-muted">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.25}
              d="M3 16l4-4 3 3 5-6 6 7M5 19h14a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v12a1 1 0 001 1z"
            />
          </svg>
        </div>
      ) : (
        <img
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[var(--motion-fast)] group-hover:scale-[1.03]"
          onError={() => {
            if (src !== cover) {
              setSrc(cover);
              return;
            }
            setFailed(true);
          }}
        />
      )}
      <span className="sr-only">{name}</span>
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-ink/50 via-ink/15 to-transparent pt-12 p-3">
        <div className="w-full rounded-control bg-surface/85 backdrop-blur-[2px] px-3 py-2 shadow-card text-left">
          <p className="text-[15px] leading-5 font-bold text-ink tracking-tight">{formatPrice(price)}</p>
          <p className="type-meta text-ink/90 font-medium line-clamp-1 mt-0.5">{name}</p>
          {location ? (
            <p className="text-[12px] leading-4 text-muted line-clamp-1 mt-0.5">{location}</p>
          ) : null}
          <p className="mt-1 text-[11px] leading-4 text-muted">
            {viewsCount} {viewsCount === 1 ? 'visualização' : 'visualizações'}
          </p>
        </div>
      </div>
    </Link>
  );
}
