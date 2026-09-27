import { useCallback, useEffect, useRef, useState } from 'react';
import { apiService, type AppNotification } from '@/lib/services/api';
import { useAuth } from '@/hooks/useAuth';

const POLL_INTERVAL = 30000;

/**
 * Central de notificações do site. Enquanto o push não está ligado, a lista e
 * o badge se mantêm por polling curto — o mesmo intervalo usado no app.
 */
export function useNotifications(limit = 20) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnread(0);
      setLoading(false);
      return;
    }
    try {
      const data = await apiService.getNotifications(limit);
      if (!mounted.current) return;
      setNotifications(data?.results || []);
      setUnread(data?.unread || 0);
      setError('');
    } catch (err) {
      if (!mounted.current) return;
      setError(err instanceof Error ? err.message : 'Falha ao carregar notificações');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [isAuthenticated, limit]);

  useEffect(() => {
    refresh();
    if (!isAuthenticated) return;
    const id = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [isAuthenticated, refresh]);

  const markRead = useCallback(async (notification: AppNotification) => {
    if (notification.is_read) return;
    // Otimista: o badge some na hora e o servidor confirma em seguida.
    setNotifications((current) =>
      current.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item))
    );
    setUnread((current) => Math.max(0, current - 1));
    try {
      await apiService.markNotificationRead(notification.id);
    } catch (err) {
      console.error('Error marking notification as read:', err);
      refresh();
    }
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
    setUnread(0);
    try {
      await apiService.markAllNotificationsRead();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      refresh();
    }
  }, [refresh]);

  const remove = useCallback(async (id: number) => {
    const previous = notifications;
    setNotifications((current) => current.filter((item) => item.id !== id));
    try {
      await apiService.deleteNotification(id);
      refresh();
    } catch (err) {
      console.error('Error deleting notification:', err);
      setNotifications(previous);
    }
  }, [notifications, refresh]);

  return { notifications, unread, loading, error, refresh, markRead, markAllRead, remove };
}
