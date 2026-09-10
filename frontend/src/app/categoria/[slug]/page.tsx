'use client';

import React, { use } from 'react';
import { CatalogPage } from '@/components/CatalogPage';

const categoryNames: Record<string, string> = {
  eletronicos: 'Eletrônicos',
  moveis: 'Móveis',
  roupas: 'Roupas e Acessórios',
  veiculos: 'Veículos',
  imoveis: 'Imóveis',
  esportes: 'Esportes e Lazer',
  outros: 'Outros',
};

export default function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const name = categoryNames[slug] || 'Categoria';

  return (
    <CatalogPage
      title={name}
      subtitle={`Explore todos os produtos da categoria ${name.toLowerCase()}.`}
      queryKey="category"
      queryValue={slug}
    />
  );
}
