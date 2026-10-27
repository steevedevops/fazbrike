'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { PageShell } from '@/components/PageShell';
import { AffiliateProductRail } from '@/components/AffiliateProductRail';
import {
  PromotionRail,
  PromotionSlider,
  useHomePromotions,
} from '@/components/PromotionCarousel';
import { CategoryIcon } from '@/components/CategoryIcon';
import { ProductGrid } from '@/components/ProductGrid';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { CATEGORIES } from '@/lib/catalog';
import { containerClass, navLinkClass, sectionTitleClass } from '@/lib/ui-classes';

const homeGridClass = 'grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 xl:grid-cols-4';

function HomeSkeleton() {
  return (
    <div className={homeGridClass} aria-hidden>
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex flex-col">
          <div className="aspect-square animate-pulse rounded-card bg-subtle" />
          <div className="mt-2 h-4 w-3/4 animate-pulse rounded-control bg-subtle" />
          <div className="mt-1 h-3 w-1/2 animate-pulse rounded-control bg-subtle" />
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const { promotions, loading } = useHomePromotions();
  const [, ...rest] = promotions;
  const header = (
    <SectionHeader
      title="Em destaque"
      href="/novidades"
      linkLabel="Ver tudo"
      divider={false}
    />
  );

  return (
    <PageShell flush>
      <PromotionSlider promotions={promotions} loading={loading} />

      <section className={`${containerClass} pt-6`} aria-label="Categorias">
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

      <section className={`${containerClass} pt-8`} aria-label="Em destaque">
        <Suspense
          fallback={
            <>
              {header}
              <HomeSkeleton />
            </>
          }
        >
          <ProductGrid query="" layout="tiles" header={header} gridClass={homeGridClass} />
        </Suspense>
      </section>

      <PromotionRail promotions={rest} />

      <div className="pb-16">
        <AffiliateProductRail />
      </div>
    </PageShell>
  );
}
