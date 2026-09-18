'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from './ProductCard';
import { ProductMosaicList } from './ProductMosaic';
import { useItems } from '@/hooks/useItems';
import { EmptyState } from '@/components/layout/EmptyState';
import { ListingSkeleton } from '@/components/layout/ListingSkeleton';
import {
  listingBrowseClass,
  listingGridClass,
  listingRailClass,
  listingRailItemClass,
  navLinkClass,
} from '@/lib/ui-classes';

interface ProductGridProps {
  query?: string;
  layout?: 'grid' | 'rail' | 'mosaic' | 'tiles';
  limit?: number;
  compact?: boolean;
  hideWhenEmpty?: boolean;
  header?: React.ReactNode;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  query,
  layout = 'grid',
  limit,
  compact = false,
  hideWhenEmpty = false,
  header,
}) => {
  const { items, error, loadItems } = useItems();
  const searchParams = useSearchParams();
  const queryString = query ?? searchParams.toString();
  const [ready, setReady] = useState(false);
  const isRail = layout === 'rail';
  const isMosaic = layout === 'mosaic';
  const isTiles = layout === 'tiles';

  useEffect(() => {
    let alive = true;
    setReady(false);
    loadItems(queryString).finally(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
    // loadItems is a stable useCallback([]) — omit from deps to avoid remount loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  if (!ready) {
    return (
      <>
        {header}
        <ListingSkeleton layout={layout} count={isRail || isMosaic ? 6 : 8} />
      </>
    );
  }

  if (error) {
    return (
      <>
        {header}
        <EmptyState
          title="Não foi possível carregar os anúncios"
          description={error}
          action={
            <button type="button" onClick={() => window.location.reload()} className={navLinkClass}>
              Tentar novamente
            </button>
          }
        />
      </>
    );
  }

  if (items.length === 0) {
    if (hideWhenEmpty) return null;
    return (
      <>
        {header}
        <EmptyState
          title="Nenhum produto encontrado"
          description="Tente outro filtro, categoria ou termo de busca."
        />
      </>
    );
  }

  const shown = limit ? items.slice(0, limit) : items;

  if (isMosaic) {
    return (
      <>
        {header}
        <ProductMosaicList items={shown} />
      </>
    );
  }

  if (isTiles) {
    return (
      <>
        {header}
        <div className={listingBrowseClass}>
          {shown.map((item) => (
            <ProductCard
              key={item.id}
              id={item.id}
              price={item.price}
              name={item.title}
              imageUrl={item.image_url}
              category={item.category}
              location={item.location}
              condition={item.condition}
              viewsCount={item.views_count || 0}
              favoritesCount={item.favorites_count || 0}
              isFavorited={!!item.is_favorited}
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      {header}
      <div className={isRail ? listingRailClass : listingGridClass}>
        {shown.map((item) => {
          const card = (
            <ProductCard
              id={item.id}
              price={item.price}
              name={item.title}
              imageUrl={item.image_url}
              category={item.category}
              location={item.location}
              condition={item.condition}
              compact={compact || isRail}
              viewsCount={item.views_count || 0}
              favoritesCount={item.favorites_count || 0}
              isFavorited={!!item.is_favorited}
            />
          );

          if (!isRail) return <React.Fragment key={item.id}>{card}</React.Fragment>;

          return (
            <div key={item.id} className={listingRailItemClass}>
              {card}
            </div>
          );
        })}
      </div>
    </>
  );
};
