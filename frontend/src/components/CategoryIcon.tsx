import React from 'react';
import { categoryIconSlug } from '@/lib/catalog';

const paths: Record<string, string> = {
  eletronicos:
    'M9 3.75h6A1.25 1.25 0 0116.25 5v14A1.25 1.25 0 0115 20.25H9A1.25 1.25 0 017.75 19V5A1.25 1.25 0 019 3.75zM10 17.25h4',
  moveis:
    'M5 10.5V8.25A2.25 2.25 0 017.25 6h9.5A2.25 2.25 0 0119 8.25v2.25M4.5 10.5h15v6.75h-15zM4.5 17.25v1.5M19.5 17.25v1.5',
  roupas:
    'M8 5.5l-3 2.5 2 2V19h10V10l2-2-3-2.5s-1.2 1.75-4 1.75S8 5.5 8 5.5z',
  veiculos:
    'M4.5 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm15 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM3.75 16.5H3V11l2-4.5h8.5l3 4.5H21v5.5h-1.5M7 8.25h6',
  imoveis:
    'M4.5 10.5L12 4.5l7.5 6V19.5h-5.25v-5.25h-4.5V19.5H4.5z',
  esportes:
    'M12 20.25a8.25 8.25 0 100-16.5 8.25 8.25 0 000 16.5zM5.4 8.25h13.2M5.4 15.75h13.2M12 3.75c-2.4 2.7-3.6 5.7-3.6 8.25s1.2 5.55 3.6 8.25c2.4-2.7 3.6-5.7 3.6-8.25S14.4 6.45 12 3.75z',
  outros:
    'M12 13.25a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5zM6.5 13.25a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5zM17.5 13.25a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z',
};

export function CategoryIcon({
  slug,
  className = 'h-3.5 w-3.5',
}: {
  slug: string;
  className?: string;
}) {
  const key = categoryIconSlug(slug);
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d={paths[key] || paths.outros}
      />
    </svg>
  );
}
