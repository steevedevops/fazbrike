'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageShell, PageSpinner } from '@/components/PageShell';
import { EmptyState } from '@/components/layout/EmptyState';
import { apiService, Conversation } from '@/lib/services/api';
import { useAuth } from '@/hooks/useAuth';
import { ConversationListPanel, conversationKey } from '@/components/messages/ConversationListPanel';
import { ChatThread } from '@/components/messages/ChatThread';
import { cx } from '@/lib/ui-classes';

interface SelectedThread {
  itemId: number;
  itemTitle: string;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatarUrl?: string;
}

function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SelectedThread | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await apiService.getConversations();
      setConversations(data || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Deep-link support: /messages?otherUserId=&itemId=&otherUserName=&otherUserAvatarUrl=&itemTitle=
  useEffect(() => {
    const otherUserId = Number(searchParams.get('otherUserId') || 0);
    if (!otherUserId) return;
    const itemId = Number(searchParams.get('itemId') || 0);
    const otherUserName = searchParams.get('otherUserName') || 'Usuário';
    const otherUserAvatarUrl = searchParams.get('otherUserAvatarUrl') || undefined;
    const itemTitle = searchParams.get('itemTitle') || (itemId ? 'Conversa' : `Conversa com ${otherUserName}`);
    setSelected({ itemId, itemTitle, otherUserId, otherUserName, otherUserAvatarUrl });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fill in/refresh display info once the real conversation list loads.
  useEffect(() => {
    if (!selected || conversations.length === 0) return;
    const match = conversations.find(
      (c) => c.other_user_id === selected.otherUserId && (c.item_id ?? 0) === selected.itemId
    );
    if (!match) return;
    setSelected((prev) =>
      prev
        ? {
            ...prev,
            itemTitle: match.item_title || prev.itemTitle,
            otherUserName: match.other_user_name || prev.otherUserName,
            otherUserAvatarUrl: match.other_user_avatar_url ?? prev.otherUserAvatarUrl,
          }
        : prev
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  const openConversation = (conv: Conversation) => {
    const next: SelectedThread = {
      itemId: conv.item_id ?? 0,
      itemTitle: conv.item_title,
      otherUserId: conv.other_user_id,
      otherUserName: conv.other_user_name,
      otherUserAvatarUrl: conv.other_user_avatar_url,
    };
    setSelected(next);
    const params = new URLSearchParams();
    params.set('otherUserId', String(next.otherUserId));
    if (next.itemId) params.set('itemId', String(next.itemId));
    router.replace(`/messages?${params.toString()}`, { scroll: false });
  };

  const closeConversation = () => {
    setSelected(null);
    router.replace('/messages', { scroll: false });
  };

  if (authLoading || loading) return <PageSpinner />;

  const hasSelection = !!selected;

  return (
    <PageShell flush showFooter={false}>
      <div className="h-[calc(100vh-68px)] flex overflow-hidden">
        <aside
          className={cx(
            'w-full lg:w-[360px] lg:shrink-0 lg:border-r border-[color:var(--color-border)] flex-col min-h-0 bg-surface',
            hasSelection ? 'hidden lg:flex' : 'flex'
          )}
        >
          <div className="px-4 py-4 border-b border-[color:var(--color-border)] shrink-0">
            <h1 className="type-title text-ink">Mensagens</h1>
            <p className="type-meta text-muted mt-0.5">Conversas com compradores e vendedores.</p>
          </div>
          <ConversationListPanel
            conversations={conversations}
            selectedKey={selected ? conversationKey({ item_id: selected.itemId, other_user_id: selected.otherUserId }) : null}
            onSelect={openConversation}
          />
        </aside>

        <section className={cx('flex-1 min-h-0 flex-col bg-canvas', hasSelection ? 'flex' : 'hidden lg:flex')}>
          {selected ? (
            <ChatThread
              key={`${selected.itemId}-${selected.otherUserId}`}
              itemId={selected.itemId}
              itemTitle={selected.itemTitle}
              otherUserId={selected.otherUserId}
              otherUserName={selected.otherUserName}
              otherUserAvatarUrl={selected.otherUserAvatarUrl}
              onBack={closeConversation}
              onMessagesRead={fetchConversations}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <EmptyState
                title="Selecione uma conversa"
                description="Escolha uma conversa na lista para ver as mensagens."
              />
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <MessagesPageContent />
    </Suspense>
  );
}
