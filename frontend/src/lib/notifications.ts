import type { NotificationType } from '@/lib/services/api';

/** Traço do ícone (24x24, stroke) usado por tipo de notificação. */
const ICON_PATHS: Record<NotificationType, string> = {
  message: 'M8 10h8M8 14h5M21 12a8 8 0 01-8 8H7l-4 3v-5.5A8 8 0 1121 12z',
  comment: 'M7 8h10M7 12h6m8 0a8 8 0 01-8 8H7l-4 3v-5.5A8 8 0 1121 12z',
  favorite:
    'M12 20s-7-4.35-7-9.5A4.5 4.5 0 0112 7a4.5 4.5 0 017 3.5C19 15.65 12 20 12 20z',
  follow: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zm10 1v6m3-3h-6',
  review: 'M12 4l2.4 5 5.6.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.6-.8z',
  boost: 'M5 15l4 4m-4-4l3-7 6-4 6 6-4 6-7 3-4-4zm9-6h.01',
  system: 'M4 10h3l9-5v14l-9-5H4v-4zm14 0a3 3 0 010 4',
};

export function notificationIconPath(type: string): string {
  return ICON_PATHS[type as NotificationType] ?? ICON_PATHS.system;
}

/** Tempo relativo curto da central ("agora", "5 min", "3 h", "2 d"). */
export function formatNotificationWhen(value?: string | Date | null): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d`;
  return date.toLocaleDateString('pt-BR');
}
