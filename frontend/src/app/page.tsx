'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { PageShell } from '@/components/PageShell';
import { AffiliateProductRail } from '@/components/AffiliateProductRail';
import { PromotionCarousel } from '@/components/PromotionCarousel';
import { CategoryIcon } from '@/components/CategoryIcon';
import { ProductGrid } from '@/components/ProductGrid';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { ListingSkeleton } from '@/components/layout/ListingSkeleton';
import { CATEGORIES } from '@/lib/catalog';
import { containerClass, navLinkClass, sectionTitleClass } from '@/lib/ui-classes';

export default function Home() {
  const header = (
    <SectionHeader
      title="Novidades"
      subtitle="Acabaram de chegar na vitrine"
      href="/novidades"
      linkLabel="Ver todas"
      divider={false}
    />
  );

  return (
    <PageShell flush>
      <section className={`${containerClass} pt-5`} aria-label="Categorias">
        <div className="mb-3 flex items-end justify-between gap-4">
          <h2 className={sectionTitleClass}>Categorias</h2>
          <Link href="/geral" className={navLinkClass}>
            Ver todas
          </Link>
        </div>
        <div className="rail-scroll flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={`/geral?category=${category.slug}`}
              className="group flex w-[84px] shrink-0 flex-col items-center gap-2 rounded-card px-1 py-1"
            >
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-pill border border-[color:var(--color-border)] bg-surface text-ink shadow-card transition-colors group-hover:bg-subtle">
                <CategoryIcon slug={category.icon || category.slug} className="h-6 w-6" />
              </span>
              <span className="line-clamp-2 text-center text-[12px] font-medium leading-4 text-ink">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <PromotionCarousel />

      <section className={`${containerClass} pt-6`} aria-label="Novidades">
        <Suspense
          fallback={
            <>
              {header}
              <ListingSkeleton layout="tiles" count={10} />
            </>
          }
        >
          <ProductGrid query="" layout="tiles" header={header} />
        </Suspense>
      </section>

      <div className="pb-16">
        <AffiliateProductRail />
      </div>
    </PageShell>
  );
}
