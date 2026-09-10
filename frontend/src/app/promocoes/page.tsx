'use client';

import React from 'react';
import { CatalogPage } from '@/components/CatalogPage';

export default function PromocoesPage() {
  return (
    <CatalogPage
      title="Promoções"
      subtitle="Os menores preços do marketplace, selecionados para você."
      sort="price_asc"
    />
  );
}
