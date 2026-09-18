'use client';

import React, { Suspense } from 'react';
import { ProductGrid } from '@/components/ProductGrid';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { ListingSkeleton } from '@/components/layout/ListingSkeleton';
import { containerClass } from '@/lib/ui-classes';

interface HomeRailProps {
  title: string;
  subtitle?: string;
  href: string;
  linkLabel?: string;
  query?: string;
}

export function HomeRail({
  title,
  subtitle,
  href,
  linkLabel = 'Ver todas',
  query,
}: HomeRailProps) {
  const header = (
    <SectionHeader
      title={title}
      subtitle={subtitle}
      href={href}
      linkLabel={linkLabel}
      divider={false}
    />
  );

  return (
    <section className={`${containerClass} pt-12`}>
      <Suspense
        fallback={
          <>
            {header}
            <ListingSkeleton layout="mosaic" count={6} />
          </>
        }
      >
        <ProductGrid
          query={query}
          layout="mosaic"
          limit={6}
          hideWhenEmpty
          header={header}
        />
      </Suspense>
    </section>
  );
}
