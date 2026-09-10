'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from './ProductCard';
import { useItems } from '@/hooks/useItems';

interface ProductGridProps {
  query?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ query }) => {
  const { items, loading, error, loadItems } = useItems();
  const searchParams = useSearchParams();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (query) {
      loadItems(`search=${encodeURIComponent(query)}`);
    } else {
      loadItems(searchParams.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, query, searchParams]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 aspect-[3/4] mb-4"></div>
            <div className="h-4 bg-gray-200 w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-sm underline underline-offset-4 hover:text-black"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Nenhum produto encontrado.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6">
      {items.map((item) => (
        <ProductCard
          key={item.id}
          id={item.id}
          price={item.price}
          name={item.title}
          imageUrl={item.image_url}
        />
      ))}
    </div>
  );
};
