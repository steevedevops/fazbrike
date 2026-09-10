'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { CatalogPage } from '@/components/CatalogPage';

export const BuscarResults: React.FC = () => {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';

  return (
    <CatalogPage
      title={q ? `Resultados para "${q}"` : 'Buscar'}
      subtitle={q ? 'Produtos encontrados para a sua busca.' : 'Encontre exatamente o que procura.'}
      searchQuery={q}
    />
  );
};
