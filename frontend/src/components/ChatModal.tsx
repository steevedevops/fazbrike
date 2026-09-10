'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiService, Message } from '@/lib/services/api';
import { useAuth } from '@/hooks/useAuth';

interface ChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemId: number;
    itemTitle: string;
    sellerId: number;
    sellerName: string;
}

/**
 * Chat no estilo "telinha" do Facebook/Messenger: uma janela compacta
 * flutuante ancorada no canto inferior direito — não uma tela gigante.
 */
export const ChatModal: React.FC<ChatModalProps> = ({
    isOpen,
    onClose,
    itemId,
    itemTitle,
    sellerId,
    sellerName
}) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const data = await apiService.getMessages(itemId);
            setMessages(data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 5000);
            return () => clearInterval(interval);
        }
    }, [isOpen, itemId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            // Optimistic update
            const tempMessage: Message = {
                id: Date.now(),
                sender_id: user?.id || 0,
                receiver_id: sellerId,
                item_id: itemId,
                content: newMessage,
                is_read: false,
                created_at: new Date().toISOString(),
            };
            setMessages([...messages, tempMessage]);
            setNewMessage('');

            await apiService.sendMessage(itemId, sellerId, newMessage);
            fetchMessages();
        } catch (error: any) {
            console.error('Error sending message:', error);
            // Regra do projeto: propague err.message (que lê responseData.error)
            const msg = error?.response?.data?.error || error?.message || 'Erro ao enviar mensagem';
            alert(msg);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col w-[360px] max-w-[calc(100vw-2rem)] shadow-2xl rounded-2xl overflow-hidden border border-gray-200 bg-white">
            {/* Header compacto (telinha) */}
            <div className="px-4 py-3 bg-gray-900 flex justify-between items-center">
                <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm truncate">{sellerName}</h3>
                    <p className="text-[11px] text-gray-300 truncate">{itemTitle}</p>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-300 hover:text-white p-1.5 rounded-full hover:bg-gray-700 transition-colors"
                    aria-label="Fechar chat"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-gray-50 h-[340px]">
                {loading && messages.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm mt-8">Carregando…</div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8 text-sm">
                        <p>Nenhuma mensagem ainda.</p>
                        <p className="text-xs mt-1">Comece a conversa com {sellerName}!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === user?.id;
                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-[13px] ${isMe
                                        ? 'bg-gray-800 text-white rounded-br-none'
                                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                                        }`}
                                >
                                    <p className="break-words">{msg.content}</p>
                                    <p className={`text-[9px] mt-0.5 ${isMe ? 'text-gray-300' : 'text-gray-400'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-2.5 border-t border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escreva algo..."
                        className="flex-1 rounded-full border border-gray-300 focus:border-gray-900 focus:ring-gray-900 px-3.5 py-1.5 text-[13px] bg-gray-50 outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-gray-900 text-white p-2 rounded-full hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                        aria-label="Enviar"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    );
};
