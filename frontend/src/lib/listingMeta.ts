type PlaceCity = {
  name?: string;
  state?: { code?: string } | null;
} | null | undefined;

/** Tempo curto para a grade, no jeito "há 32 min". */
export function formatRelativeTime(value?: string | Date | null): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? 'há 1 h' : `há ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'há 1 dia';
  if (days < 7) return `há ${days} dias`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? 'há 1 sem.' : `há ${weeks} sem.`;

  return date.toLocaleDateString('pt-BR');
}

/** Cidade do catálogo, ou o texto de localização já gravado no anúncio. */
export function listingPlace(city: PlaceCity, location?: string | null): string {
  const name = city?.name?.trim();
  if (name) {
    const code = city?.state?.code?.trim();
    return code ? `${name}, ${code}` : name;
  }
  return location?.trim() || '';
}
