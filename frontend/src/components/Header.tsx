'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export const Header: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      setIsSearchOpen(false);
      return;
    }
    router.push(`/buscar?q=${encodeURIComponent(q)}`);
    setQuery('');
    setIsSearchOpen(false);
  };

  const navLinks = [
    { href: '/', label: 'Loja' },
    { href: '/novidades', label: 'Novidades' },
    { href: '/marcas', label: 'Marcas' },
    { href: '/promocoes', label: 'Promoções' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center">
            <span className="text-2xl font-serif font-bold text-gray-900 tracking-tight">
              FAZBRIKE
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/vender"
              className="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors"
            >
              Vender
            </Link>
          </nav>

          {/* Icons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
              aria-label="Buscar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <Link
              href="/messages"
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Mensagens"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </Link>

            {isAuthenticated ? (
              <Link
                href="/perfil"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Perfil"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-flex text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors px-3 py-2"
              >
                Entrar
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-gray-900 transition-colors"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="absolute top-16 left-0 w-full bg-white border-b border-gray-100 p-4 shadow-sm">
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar produtos..."
              className="flex-1 text-lg border border-gray-200 rounded-lg px-4 py-2 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              autoFocus
            />
            <button
              type="submit"
              className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Buscar
            </button>
          </form>
        </div>
      )}

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-gray-100 shadow-sm">
          <nav className="px-4 py-4 space-y-2">
            {[
              ...navLinks,
              { href: '/vender', label: 'Vender' },
              { href: '/messages', label: 'Mensagens' },
              { href: isAuthenticated ? '/perfil' : '/login', label: isAuthenticated ? 'Meu perfil' : 'Entrar' },
            ].map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="block text-sm font-medium text-gray-700 py-2 hover:text-gray-900 transition-colors"
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
