'use client';

import React from 'react';
import Link from 'next/link';
import { formatNotificationWhen, notificationIconPath } from '@/lib/notifications';
import { resolveImageUrl, type AppNotification } from '@/lib/services/api';
import { cx, metaClass } from '@/lib/ui-classes';

interface NotificationItemProps {
  notification: AppNotification;
  onRead: (notification: AppNotification) => void;
  onDelete?: (id: number) => void;
  compact?: boolean;
}

export function NotificationItem({ notification, onRead, onDelete, compact = false }: NotificationItemProps) {
  const avatar = notification.actor?.avatar_url ? resolveImageUrl(notification.actor.avatar_url) : '';
  // Link externo cadastrado no admin abre fora; rota interna navega no site.
  const isInternal = !!notification.link && notification.link.startsWith('/');

  const body = (
    <div className="flex items-start gap-3">
      <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-pill bg-subtle text-ink">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d={notificationIconPath(notification.type)}
            />
          </svg>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cx(
            'block type-body text-ink',
            notification.is_read ? 'font-medium' : 'font-bold'
          )}
        >
          {notification.title}
        </span>
        {notification.body ? (
          <span className={cx('block mt-0.5 line-clamp-2', metaClass)}>{notification.body}</span>
        ) : null}
        <span className={cx('block mt-1', metaClass)}>{formatNotificationWhen(notification.created_at)}</span>
      </span>
      {!notification.is_read ? (
        <span className="mt-2 h-2 w-2 shrink-0 rounded-pill bg-brand-500" aria-hidden />
      ) : null}
    </div>
  );

  const rowClass = cx(
    'block w-full text-left px-4 py-3 transition-colors hover:bg-subtle',
    notification.is_read ? '' : 'bg-brand-50/40',
    compact ? '' : 'sm:px-5'
  );

  return (
    <li className="relative border-b border-[color:var(--color-border)] last:border-b-0">
      {isInternal ? (
        <Link href={notification.link!} className={rowClass} onClick={() => onRead(notification)}>
          {body}
        </Link>
      ) : (
        <button type="button" className={rowClass} onClick={() => onRead(notification)}>
          {body}
        </button>
      )}
      {onDelete ? (
        <button
          type="button"
          onClick={() => onDelete(notification.id)}
          className="absolute right-2 bottom-2 inline-flex h-8 w-8 items-center justify-center rounded-pill text-muted hover:bg-surface hover:text-danger"
          aria-label={`Remover notificação: ${notification.title}`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ) : null}
    </li>
  );
}
