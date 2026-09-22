'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AffiliateProductCard } from '@/components/AffiliateProductCard';
import { EmptyState } from '@/components/layout/EmptyState';
import { ListingSkeleton } from '@/components/layout/ListingSkeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { apiService, type AffiliateProduct } from '@/lib/services/api';
import { fieldClass, labelClass, navLinkClass, panelClass } from '@/lib/ui-classes';

type OfferSort = 'recommended' | 'price_asc' | 'price_desc';

export function AffiliateCatalog() {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [partner, setPartner] = useState('');
  const [sort, setSort] = useState<OfferSort>('recommended');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    apiService
      .get<AffiliateProduct[]>('/affiliate-products?limit=100')
      .then((data) => {
        if (alive) setProducts(data);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Não foi possível carregar as ofertas');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const partners = useMemo(() => {
    const bySlug = new Map<string, string>();
    products.forEach((product) => bySlug.set(product.partner.slug, product.partner.name));
    return Array.from(bySlug, ([slug, name]) => ({ slug, name })).sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR')
    );
  }, [products]);

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    const filtered = products.filter((product) => {
      const matchesPartner = !partner || product.partner.slug === partner;
      const haystack = `${product.title} ${product.description} ${product.partner.name}`.toLocaleLowerCase('pt-BR');
      return matchesPartner && (!term || haystack.includes(term));
    });
    if (sort === 'price_asc') return [...filtered].sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') return [...filtered].sort((a, b) => b.price - a.price);
    return filtered;
  }, [partner, products, search, sort]);

  return (
    <>
      <PageHeader
        title="Ofertas de parceiros"
        subtitle="Encontre produtos anunciados por lojas parceiras e finalize a compra diretamente no site delas."
      />

      <div className={`${panelClass} mb-7 grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_220px_220px]`}>
        <label>
          <span className={labelClass}>Buscar oferta</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome do produto"
            className={fieldClass}
          />
        </label>
        <label>
          <span className={labelClass}>Loja parceira</span>
          <select value={partner} onChange={(event) => setPartner(event.target.value)} className={fieldClass}>
            <option value="">Todas as lojas</option>
            {partners.map((option) => (
              <option key={option.slug} value={option.slug}>{option.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className={labelClass}>Ordenar</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as OfferSort)} className={fieldClass}>
            <option value="recommended">Recomendadas</option>
            <option value="price_asc">Menor preço</option>
            <option value="price_desc">Maior preço</option>
          </select>
        </label>
      </div>

      <p className="mb-6 rounded-control border border-[color:var(--color-border)] bg-subtle px-4 py-3 type-meta text-muted">
        Os itens desta página são publicidade. Preço, estoque, entrega e pagamento são responsabilidade da loja parceira e podem mudar sem aviso. O Fazbrike pode receber comissão, sem custo extra para você.
      </p>

      {loading ? <ListingSkeleton layout="grid" count={8} /> : null}
      {!loading && error ? (
        <EmptyState
          title="Não foi possível carregar as ofertas"
          description={error}
          action={<button type="button" onClick={() => window.location.reload()} className={navLinkClass}>Tentar novamente</button>}
        />
      ) : null}
      {!loading && !error && visibleProducts.length === 0 ? (
        <EmptyState
          title="Nenhuma oferta encontrada"
          description="Tente outro produto ou selecione todas as lojas."
        />
      ) : null}
      {!loading && !error && visibleProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleProducts.map((product) => (
            <AffiliateProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : null}
    </>
  );
}
