'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { NotificationItem } from '@/components/NotificationItem';
import { useNotifications } from '@/hooks/useNotifications';
import { cx, metaClass, navLinkClass } from '@/lib/ui-classes';

/** Sino do header: badge de não lidas + prévia das últimas notificações. */
export function NotificationBell() {
  const { notifications, unread, loading, markRead, markAllRead } = useNotifications(8);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="relative inline-flex items-center justify-center h-10 w-10 rounded-pill text-muted hover:bg-subtle hover:text-ink"
        aria-label={unread > 0 ? `Notificações (${unread} não lidas)` : 'Notificações'}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M15 17h5l-1.4-2.1a2 2 0 01-.6-1.4V10a6 6 0 10-12 0v3.5c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-pill bg-brand-500 text-white text-[10px] font-bold leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-card border border-[color:var(--color-border)] bg-surface shadow-card"
          role="menu"
        >
          <div className="flex items-center justify-between gap-3 border-b border-[color:var(--color-border)] px-4 py-3">
            <p className="type-title text-ink">Notificações</p>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className={navLinkClass}>
                marcar todas
              </button>
            )}
          </div>

          <div className="max-h-[22rem] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <p className={cx('px-4 py-6 text-center', metaClass)}>Carregando…</p>
            ) : notifications.length === 0 ? (
              <p className={cx('px-4 py-6 text-center', metaClass)}>
                Nada por aqui ainda. Avisos sobre mensagens, comentários e seus anúncios aparecem nesta lista.
              </p>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={(value) => {
                      markRead(value);
                      setIsOpen(false);
                    }}
                    compact
                  />
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-[color:var(--color-border)] px-4 py-3 text-center">
            <Link href="/notificacoes" onClick={() => setIsOpen(false)} className={navLinkClass}>
              ver todas
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
