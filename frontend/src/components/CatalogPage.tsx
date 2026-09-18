'use client';

import React, { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { ProductGrid } from '@/components/ProductGrid';
import { PageHeader } from '@/components/layout/PageHeader';
import { ListingSkeleton } from '@/components/layout/ListingSkeleton';
import {
  ActiveFilterChips,
  ListingFilters,
  MobileFilters,
} from '@/components/ListingFilters';
import {
  BrowseSort,
  buildItemQuery,
  currentBrowseSort,
} from '@/lib/browse';
import { fieldClass, labelClass, panelClass } from '@/lib/ui-classes';

interface CatalogPageProps {
  title: string;
  subtitle?: string;
  queryKey?: 'category' | 'condition';
  queryValue?: string;
  searchQuery?: string;
  sort?: BrowseSort;
}

export const CatalogPage: React.FC<CatalogPageProps> = (props) => {
  return (
    <PageShell>
      <Suspense
        fallback={
          <>
            <PageHeader title={props.title} subtitle={props.subtitle} />
            <ListingSkeleton layout="tiles" />
          </>
        }
      >
        <CatalogBrowse {...props} />
      </Suspense>
    </PageShell>
  );
};

function CatalogBrowse({
  title,
  subtitle,
  queryKey,
  queryValue,
  searchQuery,
  sort = 'recent',
}: CatalogPageProps) {
  const searchParams = useSearchParams();
  const lockedCategory = queryKey === 'category' ? queryValue : undefined;
  const query = buildItemQuery(searchParams, {
    category: lockedCategory,
    search: searchQuery,
    sort,
  });

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={<SortSelect fallback={sort} />}
      />
      <div className="flex items-start gap-6 lg:gap-8">
        <aside className="hidden w-[19rem] shrink-0 lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1 [scrollbar-width:thin]">
            <div className={`${panelClass} bg-surface p-5`} aria-label="Filtros">
              <ListingFilters lockedCategory={lockedCategory} />
            </div>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <MobileFilters lockedCategory={lockedCategory} />
          <ActiveFilterChips lockedCategory={lockedCategory} />
          <ProductGrid key={query} query={query} layout="tiles" />
        </div>
      </div>
    </>
  );
}

function SortSelect({ fallback }: { fallback: BrowseSort }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = currentBrowseSort(searchParams, fallback);

  const onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value as BrowseSort;
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'recent') {
      params.set('sort_by', 'date');
      params.set('order', 'desc');
    } else if (next === 'price_asc') {
      params.set('sort_by', 'price');
      params.set('order', 'asc');
    } else {
      params.set('sort_by', 'price');
      params.set('order', 'desc');
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <label className="flex items-center gap-3">
      <span className={`${labelClass} mb-0 shrink-0`}>Ordenar</span>
      <select value={value} onChange={onChange} className={`${fieldClass} w-auto min-w-44`}>
        <option value="recent">Mais recentes</option>
        <option value="price_asc">Menor preço</option>
        <option value="price_desc">Maior preço</option>
      </select>
    </label>
  );
}
