'use client';

import React from 'react';
import { Conversation, resolveImageUrl } from '@/lib/services/api';
import { formatConversationWhen } from '@/lib/messageTime';
import { EmptyState } from '@/components/layout/EmptyState';
import { metaClass } from '@/lib/ui-classes';

export function conversationKey(conv: { item_id?: number | null; other_user_id: number }): string {
  return `${conv.item_id ?? 0}-${conv.other_user_id}`;
}

interface ConversationListPanelProps {
  conversations: Conversation[];
  selectedKey: string | null;
  onSelect: (conv: Conversation) => void;
}

export function ConversationListPanel({ conversations, selectedKey, onSelect }: ConversationListPanelProps) {
  if (conversations.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          title="Nenhuma conversa ainda"
          description="Quando você entrar em contato com vendedores ou receber mensagens, elas aparecem aqui."
        />
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[color:var(--color-border)] overflow-y-auto flex-1">
      {conversations.map((conv) => {
        const key = conversationKey(conv);
        const unread = conv.unread_count || 0;
        const when = formatConversationWhen(conv.last_message_at);
        const avatar = conv.other_user_avatar_url;
        const active = key === selectedKey;
        return (
          <li key={key}>
            <button
              type="button"
              onClick={() => onSelect(conv)}
              aria-current={active || undefined}
              className={`w-full text-left p-4 flex items-center gap-3.5 hover:bg-subtle transition-colors duration-[var(--motion-instant)] ${
                active ? 'bg-subtle' : unread > 0 ? 'bg-subtle/60' : ''
              }`}
            >
              <div className="w-12 h-12 rounded-pill bg-subtle overflow-hidden flex-shrink-0 flex items-center justify-center">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveImageUrl(avatar)}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="type-title font-semibold text-muted">
                    {(conv.other_user_name || '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2 mb-0.5">
                  <p className={`truncate ${unread > 0 ? 'font-semibold text-ink' : 'type-body text-ink'}`}>
                    {conv.other_user_name}
                  </p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {when ? <span className={metaClass}>{when}</span> : null}
                    {unread > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-pill bg-ink text-white text-[10px] font-bold">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className={`${metaClass} truncate`}>{conv.item_title}</p>
                <p className={`type-meta truncate mt-0.5 ${unread > 0 ? 'text-ink' : 'text-muted'}`}>
                  {conv.last_message}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
