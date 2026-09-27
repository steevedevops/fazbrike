'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { NotificationItem } from '@/components/NotificationItem';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { btnSecondaryClass, errorBannerClass, metaClass, panelClass } from '@/lib/ui-classes';

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { notifications, unread, loading, error, markRead, markAllRead, remove } = useNotifications(50);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [authLoading, isAuthenticated, router]);

  return (
    <PageShell width="narrow">
      <PageHeader
        title="Notificações"
        subtitle="Mensagens, comentários e novidades sobre os seus anúncios."
        action={
          unread > 0 ? (
            <button type="button" onClick={markAllRead} className={btnSecondaryClass}>
              Marcar todas como lidas
            </button>
          ) : null
        }
      />

      {error ? <div className={errorBannerClass}>{error}</div> : null}

      {loading && notifications.length === 0 ? (
        <p className={metaClass}>Carregando…</p>
      ) : notifications.length === 0 ? (
        <EmptyState
          title="Nenhuma notificação"
          description="Quando alguém mandar mensagem, comentar ou salvar um anúncio seu, o aviso aparece aqui."
        />
      ) : (
        <ul className={`${panelClass} overflow-hidden`}>
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={markRead}
              onDelete={remove}
            />
          ))}
        </ul>
      )}
    </PageShell>
  );
}
