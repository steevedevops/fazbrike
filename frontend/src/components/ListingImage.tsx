'use client';

import React, { useEffect, useState } from 'react';
import { resolveImageUrl } from '@/lib/services/api';
import { listingImageSrc } from '@/lib/catalog';
import { cx } from '@/lib/ui-classes';

/** Espaço vazio no lugar de uma foto que o anúncio, perfil ou campanha não tem. */
export function EmptyPhoto({ className }: { className?: string }) {
  return (
    <div className={cx('flex h-full min-h-[120px] w-full items-center justify-center bg-subtle text-muted', className)}>
      <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.25}
          d="M3 16l4-4 3 3 5-6 6 7M5 19h14a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v12a1 1 0 001 1z"
        />
      </svg>
      <span className="sr-only">Sem foto</span>
    </div>
  );
}

/** Mostra a foto real. Sem URL, ou se ela falhar, mostra [EmptyPhoto]. */
export function ListingImage({
  src,
  alt,
  className,
  emptyClassName,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  emptyClassName?: string;
}) {
  const raw = listingImageSrc(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [raw]);

  if (!raw || failed) return <EmptyPhoto className={emptyClassName ?? className} />;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={resolveImageUrl(raw)} alt={alt} className={className} onError={() => setFailed(true)} />
  );
}
