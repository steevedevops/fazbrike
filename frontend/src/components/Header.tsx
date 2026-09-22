'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/lib/services/api';
import { playMessageSound } from '@/lib/messageSound';
import { CATEGORIES } from '@/lib/catalog';
import {
  containerClass,
  cx,
} from '@/lib/ui-classes';

const headerCats = CATEGORIES.filter((c) =>
  ['roupas', 'eletronicos', 'veiculos', 'imoveis', 'moveis', 'esportes', 'outros'].includes(c.slug)
).map((c) => ({
  href: `/geral?category=${c.slug}`,
  slug: c.slug,
  label: c.name.toLowerCase(),
}));

export const Header: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category') || '';
  const [query, setQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const prevUnreadRef = useRef<number | null>(null);

  const refreshUnread = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadTotal(0);
      prevUnreadRef.current = null;
      return;
    }
    try {
      const convs = await apiService.getConversations();
      const total = (convs || []).reduce((sum, c) => sum + (c.unread_count || 0), 0);
      if (prevUnreadRef.current !== null && total > prevUnreadRef.current) {
        playMessageSound();
      }
      prevUnreadRef.current = total;
      setUnreadTotal(total);
    } catch {
      // badge é polish
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshUnread();
    if (!isAuthenticated) return;
    const id = setInterval(refreshUnread, 12000);
    return () => clearInterval(id);
  }, [isAuthenticated, refreshUnread]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/buscar?q=${encodeURIComponent(q)}`);
    setQuery('');
    setIsMenuOpen(false);
  };

  const closeMenus = () => setIsMenuOpen(false);

  const isCatActive = (slug: string) =>
    pathname.startsWith('/geral') && activeCategory === slug;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface border-b border-[color:var(--color-border)]">
      <div className={containerClass}>
        <div className="flex items-center gap-3 sm:gap-4 h-[68px]">
          <Logo href="/" markSize={32} showWordmark={false} onClick={closeMenus} />

          <form
            onSubmit={handleSearch}
            className="flex-1 min-w-0 max-w-xl"
            role="search"
          >
            <label htmlFor="campo-busca" className="sr-only">
              Buscar produtos
            </label>
            <div className="relative">
              <input
                id="campo-busca"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='busque "iphone", "sofá", "bike"…'
                className="w-full min-h-11 pl-5 pr-12 py-2.5 bg-subtle border-0 rounded-pill type-body text-ink placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              />
              <button
                type="submit"
                className="absolute inset-y-0 right-0 flex items-center justify-center w-11 text-muted hover:text-ink"
                aria-label="Buscar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                </svg>
              </button>
            </div>
          </form>

          <nav
            className="hidden lg:flex items-center gap-4 xl:gap-5 shrink-0 ml-auto"
            aria-label="Categorias"
          >
            {headerCats.map((link) => (
              <Link
                key={link.slug}
                href={link.href}
                className={cx(
                  'type-meta lowercase tracking-tight pb-0.5 border-b-2 transition-colors',
                  isCatActive(link.slug)
                    ? 'text-ink border-brand-500 font-medium'
                    : 'text-muted border-transparent hover:text-ink'
                )}
                aria-current={isCatActive(link.slug) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/ofertas"
              className={cx(
                'type-meta lowercase tracking-tight pb-0.5 border-b-2 transition-colors',
                pathname.startsWith('/ofertas')
                  ? 'text-ink border-brand-500 font-medium'
                  : 'text-muted border-transparent hover:text-ink'
              )}
              aria-current={pathname.startsWith('/ofertas') ? 'page' : undefined}
            >
              ofertas
            </Link>
          </nav>

          <div
            className="hidden sm:block w-px h-6 bg-[color:var(--color-border)] shrink-0"
            aria-hidden
          />

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/messages"
              className="relative hidden sm:inline-flex items-center justify-center h-10 w-10 rounded-pill text-brand-500 hover:bg-subtle"
              aria-label={unreadTotal > 0 ? `Mensagens (${unreadTotal} não lidas)` : 'Mensagens'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8.228 9c.549-1.165 1.956-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {unreadTotal > 0 && (
                <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-pill bg-brand-500 text-white text-[10px] font-bold leading-none">
                  {unreadTotal > 9 ? '9+' : unreadTotal}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <Link
                href="/perfil"
                className="hidden sm:inline type-meta text-muted hover:text-ink lowercase"
              >
                perfil
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline type-meta text-muted hover:text-ink lowercase"
              >
                entrar
              </Link>
            )}

            <Link
              href="/vender"
              className="hidden sm:inline-flex items-center justify-center min-h-10 px-5 type-meta font-semibold lowercase rounded-pill bg-brand-500 text-white hover:bg-brand-600"
            >
              quero vender
            </Link>

            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-pill text-muted hover:bg-subtle hover:text-ink"
              aria-label="Menu"
              aria-expanded={isMenuOpen}
              aria-controls="menu-mobile"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div
          id="menu-mobile"
          className="lg:hidden border-t border-[color:var(--color-border)] bg-surface"
        >
          <nav className="px-4 py-3 flex flex-col" aria-label="Menu mobile">
            {[
              ...headerCats,
              { href: '/ofertas', label: 'ofertas de parceiros', slug: 'offers' },
              { href: '/vender', label: 'quero vender', slug: 'vender' },
              { href: '/messages', label: 'mensagens', slug: 'messages' },
              {
                href: isAuthenticated ? '/perfil' : '/login',
                label: isAuthenticated ? 'meu perfil' : 'entrar',
                slug: 'account',
              },
            ].map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                onClick={closeMenus}
                className="type-body text-ink lowercase py-3 border-b border-[color:var(--color-border)] last:border-b-0"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};
