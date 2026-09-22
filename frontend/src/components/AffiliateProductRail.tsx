'use client';

import React, { useEffect, useState } from 'react';
import { AffiliateProductCard } from '@/components/AffiliateProductCard';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { apiService, type AffiliateProduct } from '@/lib/services/api';
import { containerClass } from '@/lib/ui-classes';

export function AffiliateProductRail() {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    apiService
      .get<AffiliateProduct[]>('/affiliate-products?limit=6')
      .then((data) => {
        if (alive) setProducts(data);
      })
      .catch(() => {
        if (alive) setProducts([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section className={`${containerClass} pt-12`} aria-label="Ofertas de parceiros">
      <SectionHeader
        title="Ofertas de parceiros"
        subtitle="Produtos selecionados em lojas parceiras. Podemos receber comissão pela compra."
        href="/ofertas"
        linkLabel="Ver todas"
        divider={false}
      />
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:thin]">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-[360px] w-[220px] shrink-0 animate-pulse rounded-card border border-[color:var(--color-border)] bg-subtle sm:w-[240px]"
              />
            ))
          : products.map((product) => (
              <div key={product.id} className="w-[220px] shrink-0 snap-start sm:w-[240px]">
                <AffiliateProductCard product={product} compact />
              </div>
            ))}
      </div>
    </section>
  );
}
