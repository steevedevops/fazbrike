'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { favoriteItem, resolveImageUrl, unfavoriteItem } from '@/lib/services/api';
import { categoryCover, formatPrice, listingImageSrc } from '@/lib/catalog';

interface ProductCardProps {
  id: number;
  price: number;
  name: string;
  imageUrl?: string;
  category?: string;
  location?: string;
  condition?: string;
  compact?: boolean;
  viewsCount?: number;
  favoritesCount?: number;
  isFavorited?: boolean;
  onFavoriteChange?: (itemId: number, favorited: boolean, favoritesCount: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  price,
  name,
  imageUrl,
  category,
  location,
  compact = false,
  viewsCount = 0,
  favoritesCount = 0,
  isFavorited = false,
  onFavoriteChange,
}) => {
  const cover = categoryCover(category);
  const initial = listingImageSrc(imageUrl, category);
  const resolved = initial === cover ? cover : resolveImageUrl(initial);
  const [src, setSrc] = useState(resolved);
  const [failed, setFailed] = useState(false);
  const [favorited, setFavorited] = useState(isFavorited);
  const [favoriteCount, setFavoriteCount] = useState(favoritesCount);
  const [savingFavorite, setSavingFavorite] = useState(false);

  useEffect(() => {
    const next = listingImageSrc(imageUrl, category);
    setSrc(next === cover ? cover : resolveImageUrl(next));
    setFailed(false);
  }, [imageUrl, category, cover]);

  useEffect(() => {
    setFavorited(isFavorited);
  }, [isFavorited]);

  useEffect(() => {
    setFavoriteCount(favoritesCount);
  }, [favoritesCount]);

  const handleFavorite = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (savingFavorite) return;

    setSavingFavorite(true);
    try {
      const response = favorited ? await unfavoriteItem(id) : await favoriteItem(id);
      setFavorited(response.favorited);
      setFavoriteCount(response.favorites_count);
      onFavoriteChange?.(id, response.favorited, response.favorites_count);
    } catch (err) {
      const status =
        err && typeof err === 'object' && 'status' in err
          ? Number((err as { status?: unknown }).status)
          : 0;
      if (status === 401 && typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } finally {
      setSavingFavorite(false);
    }
  };

  return (
    <div
      className={`group relative block w-full overflow-hidden rounded-card bg-subtle ${
        compact ? 'min-h-[200px] aspect-square' : 'min-h-[240px] aspect-[4/5] sm:aspect-[4/5]'
      }`}
    >
      <Link href={`/produto/${id}`} className="absolute inset-0">
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
            <span className="sr-only">{name}</span>
          </div>
        ) : (
          <img
            src={src}
            alt={name}
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

        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-ink/55 via-ink/20 to-transparent pt-16 p-3">
          <div className="w-full rounded-control bg-surface/85 backdrop-blur-[2px] px-3 py-2 shadow-card text-left">
            <p className="text-[15px] leading-5 font-bold text-ink tracking-tight">{formatPrice(price)}</p>
            <h3 className="type-meta text-ink/90 font-medium line-clamp-1 leading-snug mt-0.5">
              {name}
            </h3>
            {location ? (
              <p className="text-[12px] leading-4 text-muted line-clamp-1 mt-0.5">{location}</p>
            ) : null}
            <div className="mt-1 flex items-center gap-2 text-[11px] leading-4 text-muted">
              <span>{viewsCount} {viewsCount === 1 ? 'visualização' : 'visualizações'}</span>
              {favoriteCount > 0 ? <span>{favoriteCount} salvos</span> : null}
            </div>
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={handleFavorite}
        disabled={savingFavorite}
        className={`absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-pill border border-white/65 bg-surface/85 text-ink shadow-card backdrop-blur-[2px] transition-colors hover:bg-white ${
          favorited ? 'text-ink' : 'text-muted'
        }`}
        aria-label={favorited ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
        title={favorited ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
      >
        <svg className="h-4 w-4" fill={favorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
        </svg>
      </button>
    </div>
  );
};
