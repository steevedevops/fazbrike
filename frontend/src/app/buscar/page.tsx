'use client';

import React, { Suspense } from 'react';
import { CatalogPage } from '@/components/CatalogPage';
import { BuscarResults } from '@/components/BuscarResults';

export default function BuscarPage() {
  return (
    <Suspense fallback={<CatalogPage title="Buscar" subtitle="Carregando resultados..." />}>
      <BuscarResults />
    </Suspense>
  );
}
