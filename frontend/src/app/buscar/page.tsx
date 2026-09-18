'use client';

import React, { Suspense } from 'react';
import { PageShell } from '@/components/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { ListingSkeleton } from '@/components/layout/ListingSkeleton';
import { BuscarResults } from '@/components/BuscarResults';

export default function BuscarPage() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <PageHeader title="Buscar" subtitle="Carregando resultados..." />
          <ListingSkeleton layout="tiles" />
        </PageShell>
      }
    >
      <BuscarResults />
    </Suspense>
  );
}
