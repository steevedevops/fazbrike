'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductGrid } from '@/components/ProductGrid';

const categories = [
  { slug: 'eletronicos', name: 'Eletrônicos', emoji: '📱' },
  { slug: 'moveis', name: 'Móveis', emoji: '🛋️' },
  { slug: 'roupas', name: 'Roupas', emoji: '👕' },
  { slug: 'veiculos', name: 'Veículos', emoji: '🚗' },
  { slug: 'imoveis', name: 'Imóveis', emoji: '🏠' },
  { slug: 'esportes', name: 'Esportes', emoji: '⚽' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-16">
        {/* Hero */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-gray-900 mb-4 tracking-tight">
            Compre. Venda. Conecte.
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            O marketplace simples para descobrir produtos incríveis e vender o que você não usa mais.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/vender"
              className="bg-gray-900 text-white text-sm font-medium px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Vender um item
            </Link>
            <Link
              href="/novidades"
              className="text-gray-900 text-sm font-medium px-6 py-3 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors"
            >
              Explorar novidades
            </Link>
          </div>
        </section>

        {/* Categories */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categoria/${cat.slug}`}
                className="bg-white border border-gray-100 rounded-xl p-5 text-center shadow-sm hover:shadow-lg transition-shadow"
              >
                <span className="text-2xl block mb-2">{cat.emoji}</span>
                <span className="text-sm font-medium text-gray-900">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Latest products */}
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-16">
          <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
            <h2 className="text-2xl font-serif font-bold text-gray-900 tracking-tight">
              Novidades
            </h2>
            <Link
              href="/novidades"
              className="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors"
            >
              Ver todas
            </Link>
          </div>
          <Suspense fallback={<HomeGridSkeleton />}>
            <ProductGrid key="home-latest" query="" />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}

const HomeGridSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="bg-gray-200 aspect-[3/4] mb-4" />
        <div className="h-4 bg-gray-200 w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 w-1/4" />
      </div>
    ))}
  </div>
);
