'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiService, Message, MessageAttachment, resolveImageUrl } from '@/lib/services/api';
import { useAuth } from '@/hooks/useAuth';
import { formatMessageTime } from '@/lib/messageTime';
import { playMessageSound } from '@/lib/messageSound';
import { btnInkClass, cx, fieldClass, iconButtonClass, metaClass } from '@/lib/ui-classes';

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_ATTACHMENT_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
const ALLOWED_ATTACHMENT_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,application/pdf';

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Avatar({ url, name, size = 28 }: { url?: string; name: string; size?: number }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolveImageUrl(url)}
        alt=""
        width={size}
        height={size}
        className="rounded-pill object-cover flex-shrink-0 bg-subtle"
        style={{ width: size, height: size }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }
  return (
    <span
      className="inline-flex items-center justify-center rounded-pill bg-subtle text-ink type-meta font-semibold flex-shrink-0"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {initial}
    </span>
  );
}

function AttachmentIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21.44 11.05l-9.19 9.19a5.5 5.5 0 01-7.78-7.78l9.19-9.19a3.5 3.5 0 114.95 4.95L9.41 17.4a1.5 1.5 0 01-2.12-2.12l8.49-8.49"
      />
    </svg>
  );
}

function FileChip({ attachment, tone }: { attachment: MessageAttachment | Pick<Message, 'attachment_url' | 'attachment_name' | 'attachment_size'>; tone: 'me' | 'other' }) {
  const url = 'url' in attachment ? attachment.url : attachment.attachment_url;
  const name = 'name' in attachment ? attachment.name : attachment.attachment_name;
  const size = 'size' in attachment ? attachment.size : attachment.attachment_size;
  return (
    <a
      href={resolveImageUrl(url)}
      target="_blank"
      rel="noreferrer"
      className={cx(
        'flex items-center gap-2 rounded-control px-2.5 py-2 mb-1.5 max-w-full',
        tone === 'me' ? 'bg-white/10 text-white' : 'bg-subtle text-ink'
      )}
    >
      <AttachmentIcon />
      <span className="min-w-0">
        <span className="block truncate type-meta font-medium">{name || 'Arquivo'}</span>
        {size ? <span className="block text-[11px] opacity-70">{formatBytes(size)}</span> : null}
      </span>
    </a>
  );
}

interface ChatThreadProps {
  itemId: number;
  itemTitle: string;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatarUrl?: string;
  onBack?: () => void;
  onMessagesRead?: () => void;
}

export const ChatThread: React.FC<ChatThreadProps> = ({
  itemId,
  itemTitle,
  otherUserId,
  otherUserName,
  otherUserAvatarUrl,
  onBack,
  onMessagesRead,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const knownIdsRef = useRef<Set<number>>(new Set());
  const primedRef = useRef(false);

  const fetchMessages = useCallback(
    async (opts?: { markRead?: boolean; silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      try {
        const data = await apiService.getMessages(itemId, otherUserId);
        if (primedRef.current) {
          const incoming = data.filter(
            (m) => m.sender_id !== user?.id && !knownIdsRef.current.has(m.id)
          );
          if (incoming.length > 0) playMessageSound();
        }
        knownIdsRef.current = new Set(data.map((m) => m.id));
        primedRef.current = true;
        setMessages(data);
        if (opts?.markRead) {
          await apiService.markMessagesAsRead(itemId, otherUserId);
          onMessagesRead?.();
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [itemId, otherUserId, onMessagesRead, user?.id]
  );

  useEffect(() => {
    primedRef.current = false;
    knownIdsRef.current = new Set();
    setMessages([]);
    fetchMessages({ markRead: true });
    const interval = setInterval(() => fetchMessages({ silent: true }), 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, otherUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    };
  }, [pendingPreviewUrl]);

  const clearPendingFile = () => {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingFile(null);
    setPendingPreviewUrl(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ALLOWED_ATTACHMENT_MIME.includes(file.type)) {
      setError('Envie uma foto (JPEG, PNG, WebP, GIF) ou um PDF.');
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setError('Arquivo muito grande (máx. 5MB).');
      return;
    }
    setError('');
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingFile(file);
    setPendingPreviewUrl(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content && !pendingFile) return;

    setSending(true);
    setError('');
    try {
      let attachment: MessageAttachment | undefined;
      if (pendingFile) {
        attachment = await apiService.uploadMessageAttachment(pendingFile);
      }
      const sent = await apiService.sendMessage(itemId, otherUserId, content, attachment);
      knownIdsRef.current.add(sent.id);
      setMessages((prev) => [...prev, sent]);
      setNewMessage('');
      clearPendingFile();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : 'Erro ao enviar mensagem';
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-4 py-3 bg-ink flex justify-between items-center gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className={`${iconButtonClass} text-white hover:text-white hover:bg-white/10 -ml-1.5 lg:hidden`}
              aria-label="Voltar para as conversas"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : null}
          <Avatar url={otherUserAvatarUrl} name={otherUserName} size={32} />
          <div className="min-w-0">
            <h3 className="font-semibold text-white type-meta truncate">{otherUserName}</h3>
            <p className="text-[12px] text-white/70 truncate">{itemTitle}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 bg-canvas min-h-0">
        {loading && messages.length === 0 ? (
          <p className={`${metaClass} text-center mt-8`}>Carregando…</p>
        ) : messages.length === 0 ? (
          <div className="text-center mt-8">
            <p className="type-body text-muted">Nenhuma mensagem ainda.</p>
            <p className={`${metaClass} mt-1`}>Comece a conversa com {otherUserName}.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            const time = formatMessageTime(msg.created_at);
            const avatarUrl = isMe ? undefined : msg.sender_avatar_url || otherUserAvatarUrl;
            const name = isMe ? user?.name || 'Você' : msg.sender_name || otherUserName;
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe ? <Avatar url={avatarUrl} name={name} size={28} /> : null}
                <div
                  className={`max-w-[80%] sm:max-w-[65%] rounded-card px-3 py-1.5 type-meta break-words ${
                    isMe
                      ? 'bg-ink text-white'
                      : 'bg-surface text-ink border border-[color:var(--color-border)]'
                  }`}
                >
                  {msg.attachment_url ? (
                    msg.attachment_kind === 'image' ? (
                      <a href={resolveImageUrl(msg.attachment_url)} target="_blank" rel="noreferrer" className="block mb-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolveImageUrl(msg.attachment_url)}
                          alt=""
                          className="max-h-52 w-auto rounded-control object-cover"
                        />
                      </a>
                    ) : (
                      <FileChip attachment={msg} tone={isMe ? 'me' : 'other'} />
                    )
                  ) : null}
                  {msg.content ? <p>{msg.content}</p> : null}
                  {time ? (
                    <p className={`text-[11px] mt-0.5 ${isMe ? 'text-white/70' : 'text-muted'}`}>{time}</p>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-[color:var(--color-border)] bg-surface shrink-0">
        {error ? <p className="type-meta text-danger mb-2">{error}</p> : null}
        {pendingFile ? (
          <div className="flex items-center gap-2 mb-2 p-2 rounded-control bg-subtle">
            {pendingPreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pendingPreviewUrl} alt="" className="w-10 h-10 rounded-control object-cover" />
            ) : (
              <AttachmentIcon />
            )}
            <span className="type-meta truncate flex-1 min-w-0">{pendingFile.name}</span>
            <button
              type="button"
              onClick={clearPendingFile}
              className={iconButtonClass}
              aria-label="Remover anexo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_ATTACHMENT_ACCEPT}
            className="sr-only"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={iconButtonClass}
            aria-label="Anexar foto ou arquivo"
          >
            <AttachmentIcon />
          </button>
          <label htmlFor="chat-message" className="sr-only">
            Escrever mensagem
          </label>
          <input
            id="chat-message"
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escreva algo..."
            className={`${fieldClass} min-h-10`}
          />
          <button
            type="submit"
            disabled={sending || (!newMessage.trim() && !pendingFile)}
            className={`${btnInkClass} px-3`}
            aria-label="Enviar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};
