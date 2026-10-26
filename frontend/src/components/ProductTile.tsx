import Link from 'next/link';
import { formatPrice } from '@/lib/catalog';
import { formatRelativeTime } from '@/lib/listingMeta';
import { ListingImage } from '@/components/ListingImage';

export interface ProductTileProps {
  id: number;
  price: number;
  name: string;
  imageUrl?: string;
  category?: string;
  location?: string;
  createdAt?: string;
  viewsCount?: number;
}

export function ProductTile({ id, price, name, imageUrl, location, createdAt }: ProductTileProps) {
  const when = formatRelativeTime(createdAt);
  const meta = [when, location].filter(Boolean).join(' · ');

  return (
    <Link href={`/produto/${id}`} className="group flex h-full min-h-0 flex-col">
      <div className="relative aspect-square overflow-hidden rounded-card bg-subtle">
        <ListingImage
          src={imageUrl}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[var(--motion-fast)] group-hover:scale-[1.03]"
          emptyClassName="absolute inset-0 min-h-0"
        />
        <span className="pointer-events-none absolute bottom-2 left-2 z-10 rounded-control bg-surface px-2 py-1 text-[15px] font-bold leading-5 tracking-tight text-ink shadow-card">
          {formatPrice(price)}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 type-meta font-medium leading-snug text-ink">{name}</p>
      {meta ? <p className="mt-0.5 line-clamp-1 text-[12px] leading-4 text-muted">{meta}</p> : null}
    </Link>
  );
}
