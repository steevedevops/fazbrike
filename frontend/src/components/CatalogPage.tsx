'use client';

import React, { Suspense } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductGrid } from '@/components/ProductGrid';

interface CatalogPageProps {
  title: string;
  subtitle?: string;
  queryKey?: 'category' | 'condition';
  queryValue?: string;
  searchQuery?: string;
  sort?: 'recent' | 'price_asc' | 'price_desc';
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  title,
  subtitle,
  queryKey,
  queryValue,
  searchQuery,
  sort,
}) => {
  const params = new URLSearchParams();
  if (queryKey && queryValue) {
    params.set(queryKey, queryValue);
  }
  if (searchQuery) {
    params.set('search', searchQuery);
  }
  if (sort === 'price_asc') {
    params.set('sort_by', 'price');
    params.set('order', 'asc');
  } else if (sort === 'price_desc') {
    params.set('sort_by', 'price');
    params.set('order', 'desc');
  }

  const query = params.toString() || undefined;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Hero */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-500 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        <Suspense fallback={<GridSkeleton />}>
          <ProductGrid key={query} query={query} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
};

const GridSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="bg-gray-200 aspect-[3/4] mb-4" />
        <div className="h-4 bg-gray-200 w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 w-1/4" />
      </div>
    ))}
  </div>
);
