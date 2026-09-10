'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useItems } from '@/hooks/useItems';
import { Item, resolveImageUrl } from '@/lib/services/api';

export default function PerfilPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth();
  const { getUserItems, loading: itemsLoading, error } = useItems();
  const [myItems, setMyItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetch = async () => {
      if (!isAuthenticated) return;
      try {
        const data = await getUserItems();
        setMyItems(data || []);
      } catch (err) {
        console.error('Error loading user items:', err);
      }
    };
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Profile header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-xl text-gray-900 font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-serif font-semibold text-gray-900 tracking-tight">
                {user.name}
              </h1>
              <p className="text-gray-500 text-sm">{user.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/vender"
                className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                + Vender item
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-gray-600 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-500 border-t border-gray-100 pt-6">
            <p>
              <span className="text-gray-400">Membro desde </span>
              {new Date(user.created_at).toLocaleDateString('pt-BR')}
            </p>
            <p>
              <span className="text-gray-400">Status </span>
              <span className="text-gray-900 font-medium">Conta ativa</span>
            </p>
          </div>
        </div>

        {/* My listings */}
        <div className="mb-6">
          <h2 className="text-xl font-serif font-semibold text-gray-900 tracking-tight">
            Meus anúncios
          </h2>
          <p className="text-sm text-gray-500">{myItems.length} anúncio(s)</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>
        )}

        {itemsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-[3/4] rounded-2xl mb-4" />
                <div className="h-4 bg-gray-200 w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 w-1/4" />
              </div>
            ))}
          </div>
        ) : myItems.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-gray-500">Você ainda não publicou nenhum anúncio.</p>
            <Link
              href="/vender"
              className="inline-block mt-4 text-sm font-medium text-gray-900 hover:underline"
            >
              Publicar meu primeiro item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {myItems.map((item) => (
              <Link
                key={item.id}
                href={`/produto/${item.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="aspect-[3/4] bg-gray-100">
                  {item.image_url ? (
                    <img
                      src={resolveImageUrl(item.image_url)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      Sem imagem
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-base font-medium text-gray-900 line-clamp-2">{item.title}</h3>
                  <p className="mt-2 text-lg font-bold text-gray-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(item.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
