'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { containerClass, cx, metaClass, navLinkClass } from '@/lib/ui-classes';

const columns = [
  {
    title: 'Explorar',
    links: [
      { href: '/', label: 'Loja' },
      { href: '/geral', label: 'Geral' },
      { href: '/novidades', label: 'Novidades' },
      { href: '/marcas', label: 'Marcas' },
      { href: '/promocoes', label: 'Promoções' },
    ],
  },
  {
    title: 'Marketplace',
    links: [
      { href: '/vender', label: 'Vender um item' },
      { href: '/categoria/eletronicos', label: 'Eletrônicos' },
      { href: '/categoria/moveis', label: 'Móveis' },
      { href: '/categoria/veiculos', label: 'Veículos' },
    ],
  },
  {
    title: 'Conta',
    links: [
      { href: '/perfil', label: 'Meu perfil' },
      { href: '/messages', label: 'Mensagens' },
      { href: '/login', label: 'Entrar' },
    ],
  },
];

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface border-t border-[color:var(--color-border)] mt-auto">
      <div className={cx(containerClass, 'py-12')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Logo href="/" markSize={28} />
            <p className={`${metaClass} mt-3 max-w-xs`}>
              Compre e venda de forma simples, segura e direta.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="type-meta font-semibold text-ink uppercase tracking-wide mb-3">
                {column.title}
              </h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={navLinkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-[color:var(--color-border)] flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className={metaClass}>
            © {new Date().getFullYear()} Fazbrike. Todos os direitos reservados.
          </p>
          <p className={metaClass}>Feito com dedicação no Brasil.</p>
        </div>
      </div>
    </footer>
  );
};
