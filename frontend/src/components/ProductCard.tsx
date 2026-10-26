'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { favoriteItem, unfavoriteItem } from '@/lib/services/api';
import { formatPrice } from '@/lib/catalog';
import { formatRelativeTime } from '@/lib/listingMeta';
import { ListingImage } from '@/components/ListingImage';

interface ProductCardProps {
  id: number;
  price: number;
  name: string;
  imageUrl?: string;
  category?: string;
  location?: string;
  condition?: string;
  compact?: boolean;
  createdAt?: string;
  viewsCount?: number;
  favoritesCount?: number;
  isFavorited?: boolean;
  href?: string;
  showFavorite?: boolean;
  onFavoriteChange?: (itemId: number, favorited: boolean, favoritesCount: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  price,
  name,
  imageUrl,
  location,
  createdAt,
  isFavorited = false,
  href,
  showFavorite = true,
  onFavoriteChange,
}) => {
  const [favorited, setFavorited] = useState(isFavorited);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const destination = href ?? `/produto/${id}`;
  const when = formatRelativeTime(createdAt);
  const meta = [when, location].filter(Boolean).join(' · ');

  useEffect(() => {
    setFavorited(isFavorited);
  }, [isFavorited]);

  const handleFavorite = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (savingFavorite) return;

    setSavingFavorite(true);
    try {
      const response = favorited ? await unfavoriteItem(id) : await favoriteItem(id);
      setFavorited(response.favorited);
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
    <article className="group relative flex flex-col">
      <Link href={destination} className="block min-w-0">
        <div className="relative aspect-square overflow-hidden rounded-card bg-subtle">
          <ListingImage
            src={imageUrl}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[var(--motion-fast)] group-hover:scale-[1.03]"
            emptyClassName="absolute inset-0 min-h-0"
          />
          <span className="pointer-events-none absolute bottom-2 left-2 z-10 rounded-control bg-surface px-2 py-1 text-[15px] font-bold leading-5 tracking-tight text-ink shadow-card">
            {formatPrice(price)}
          </span>
        </div>
        <h3 className="mt-2 line-clamp-2 type-meta font-medium leading-snug text-ink">{name}</h3>
        {meta ? <p className="mt-0.5 line-clamp-1 text-[12px] leading-4 text-muted">{meta}</p> : null}
      </Link>

      {showFavorite ? (
        <button
          type="button"
          onClick={handleFavorite}
          disabled={savingFavorite}
          className={`absolute right-2 top-2 z-20 inline-flex h-8 w-8 items-center justify-center rounded-pill bg-surface/90 text-ink shadow-card transition-colors hover:bg-white ${
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
      ) : null}
    </article>
  );
};
