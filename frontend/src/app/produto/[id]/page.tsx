'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { useItems } from '@/hooks/useItems';
import { useAuth } from '@/hooks/useAuth';
import { Item, resolveImageUrl } from '@/lib/services/api';

import { ChatModal } from '@/components/ChatModal';

export default function ProductDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { getItem, deleteItem } = useItems();
    const { user } = useAuth();
    const [item, setItem] = useState<Item | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    useEffect(() => {
        const fetchItem = async () => {
            if (!params.id) return;

            try {
                const data = await getItem(Number(params.id));
                setItem(data);
            } catch (err) {
                setError('Produto não encontrado ou erro ao carregar.');
            } finally {
                setLoading(false);
            }
        };

        fetchItem();
    }, [params.id, getItem]);

    const handleDelete = async () => {
        if (!item || !confirm('Tem certeza que deseja excluir este anúncio?')) return;

        setDeleting(true);
        try {
            await deleteItem(item.id);
            router.push('/');
        } catch (err) {
            alert('Erro ao excluir item');
            setDeleting(false);
        }
    };

    const handleChat = () => {
        if (!user) {
            router.push('/login');
            return;
        }
        setIsChatOpen(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error || !item) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="pt-24 px-4 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Ops!</h2>
                    <p className="text-gray-600 mb-8">{error || 'Produto não encontrado.'}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="text-gray-900 hover:text-gray-600 font-medium"
                    >
                        Voltar para a loja
                    </button>
                </div>
            </div>
        );
    }

    // Formatar preço
    const formattedPrice = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(item.price);

    // URL da imagem (com fallback)
    const imageUrl = resolveImageUrl(item.image_url);

    const isOwner = user && item.user_id === user.id;

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                        {/* Image Section */}
                        <div className="relative h-96 md:h-auto bg-gray-100">
                            <img
                                src={imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Details Section */}
                        <div className="p-8 md:p-12 flex flex-col justify-center">
                            <div className="mb-6">
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                                    {item.title}
                                </h1>
                                <div className="flex items-center text-sm text-gray-500 mb-4">
                                    <span>Publicado em {new Date(item.created_at).toLocaleDateString()}</span>
                                    <span className="mx-2">•</span>
                                    <span>Por {(item as any).User?.name || 'Vendedor'}</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">
                                    {formattedPrice}
                                </p>
                                {item.location && (
                                    <p className="text-sm text-gray-500 mt-2 flex items-center">
                                        <span className="mr-1">📍</span> {item.location}
                                    </p>
                                )}
                            </div>

                            <div className="prose prose-sm text-gray-600 mb-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Descrição</h3>
                                <p className="whitespace-pre-line">{item.description}</p>

                                {item.condition && (
                                    <div className="mt-4">
                                        <span className="font-semibold text-gray-900">Condição: </span>
                                        <span className="text-gray-700">
                                            {item.condition === 'new' ? 'Novo' :
                                                item.condition === 'used_like_new' ? 'Usado - Como novo' :
                                                    item.condition === 'used_good' ? 'Usado - Bom' : 'Usado - Aceitável'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto pt-6 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-900 font-bold mr-3">
                                            {(item as any).User?.name?.charAt(0).toUpperCase() || 'V'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{(item as any).User?.name || 'Vendedor'}</p>
                                            <p className="text-xs text-gray-500">{(item as any).User?.email || 'Email oculto'}</p>
                                        </div>
                                    </div>
                                </div>

                                {isOwner ? (
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        className="w-full bg-red-50 text-red-600 py-4 rounded-xl hover:bg-red-100 transition-all font-semibold shadow-sm hover:shadow flex items-center justify-center"
                                    >
                                        {deleting ? 'Excluindo...' : 'Excluir Anúncio'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleChat}
                                        className="w-full bg-gray-900 text-white py-4 rounded-xl hover:bg-gray-800 transition-colors font-semibold flex items-center justify-center"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.013 8.013 0 01-5.45-2.152L2.42 21l1.602-4.217A8.001 8.001 0 012 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                                        </svg>
                                        Enviar Mensagem
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {item && (
                <ChatModal
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                    itemId={item.id}
                    itemTitle={item.title}
                    sellerId={item.user_id}
                    sellerName={(item as any).User?.name || 'Vendedor'}
                />
            )}
        </div>
    );
}
