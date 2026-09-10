'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { apiService, Conversation, resolveImageUrl } from '@/lib/services/api';
import { useAuth } from '@/hooks/useAuth';
import { ChatModal } from '@/components/ChatModal';

export default function MessagesPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        const fetchConversations = async () => {
            if (!isAuthenticated) return;
            try {
                const data = await apiService.getConversations();
                setConversations(data);
            } catch (error) {
                console.error('Error fetching conversations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
    }, [isAuthenticated]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    // Helper to format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Ontem';
        } else {
            return date.toLocaleDateString();
        }
    };

    // Helper for image URL
    const getImageUrl = (url?: string) => resolveImageUrl(url);

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Mensagens</h1>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {conversations.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.013 8.013 0 01-5.45-2.152L2.42 21l1.602-4.217A8.001 8.001 0 012 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                            </svg>
                            <p className="text-lg font-medium">Nenhuma conversa ainda</p>
                            <p className="text-sm mt-2">Quando você entrar em contato com vendedores ou receber mensagens, elas aparecerão aqui.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {conversations.map((conv) => (
                                <div
                                    key={`${conv.item_id}-${conv.other_user_id}`}
                                    onClick={() => setSelectedConversation(conv)}
                                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-4"
                                >
                                    {/* Item Image */}
                                    <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                        <img
                                            src={getImageUrl(conv.item_image_url)}
                                            alt={conv.item_title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-semibold text-gray-900 truncate pr-2">
                                                {conv.other_user_name}
                                            </h3>
                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                {formatDate(conv.last_message_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 font-medium truncate mb-0.5">
                                            {conv.item_title}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate">
                                            {conv.last_message}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {selectedConversation && (
                <ChatModal
                    isOpen={!!selectedConversation}
                    onClose={() => setSelectedConversation(null)}
                    itemId={selectedConversation.item_id}
                    itemTitle={selectedConversation.item_title}
                    sellerId={selectedConversation.other_user_id}
                    sellerName={selectedConversation.other_user_name}
                />
            )}
        </div>
    );
}
