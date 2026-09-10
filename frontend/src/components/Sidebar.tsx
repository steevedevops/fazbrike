'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const categories = [
    { id: 'eletronicos', name: 'Eletrônicos', icon: '📱' },
    { id: 'moveis', name: 'Móveis', icon: '🛋️' },
    { id: 'roupas', name: 'Roupas', icon: '👕' },
    { id: 'veiculos', name: 'Veículos', icon: '🚗' },
    { id: 'imoveis', name: 'Imóveis', icon: '🏠' },
    { id: 'esportes', name: 'Esportes', icon: '⚽' },
  ];

  const handleFilterChange = (key: string, value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (!value) {
      current.delete(key);
    } else {
      current.set(key, value);
    }

    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`/${query}`);
  };

  return (
    <aside className="hidden lg:block w-80 fixed left-0 top-16 bottom-0 overflow-y-auto bg-white border-r border-gray-200 p-4 z-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 px-2">Marketplace</h2>

        <div className="space-y-1">
          <Link
            href="/"
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === '/' && !searchParams.get('category')
                ? 'bg-purple-50 text-purple-700'
                : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center mr-3 ${pathname === '/' && !searchParams.get('category') ? 'bg-purple-200' : 'bg-gray-200'
              }`}>
              <span className="text-lg">🏪</span>
            </div>
            Explorar tudo
          </Link>

          <Link
            href="/vender"
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === '/vender'
                ? 'bg-purple-50 text-purple-700'
                : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center mr-3 ${pathname === '/vender' ? 'bg-purple-200' : 'bg-gray-200'
              }`}>
              <span className="text-lg">➕</span>
            </div>
            Criar novo anúncio
          </Link>

          <Link
            href="/login"
            className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center mr-3">
              <span className="text-lg">👤</span>
            </div>
            Seu perfil
          </Link>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4 mb-4">
        <div className="px-2 mb-2 flex justify-between items-center">
          <h3 className="text-base font-semibold text-gray-900">Filtros</h3>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-purple-600 hover:underline"
          >
            Limpar
          </button>
        </div>

        <div className="px-2 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
            <input
              type="text"
              placeholder="Cidade, Estado"
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço Máximo</label>
            <input
              type="number"
              placeholder="R$ 0,00"
              onChange={(e) => handleFilterChange('max_price', e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2 px-2">Categorias</h3>
        <div className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleFilterChange('category', cat.id)}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${searchParams.get('category') === cat.id
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center mr-3 ${searchParams.get('category') === cat.id ? 'bg-purple-200' : 'bg-gray-200'
                }`}>
                <span className="text-lg">{cat.icon}</span>
              </div>
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
