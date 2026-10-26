import React from 'react';
import {
  listingBrowseClass,
  listingGridClass,
  listingMosaicClass,
  listingRailClass,
  listingRailItemClass,
} from '@/lib/ui-classes';

interface ListingSkeletonProps {
  count?: number;
  layout?: 'grid' | 'rail' | 'mosaic' | 'tiles';
}

const mosaicSlots = [
  'col-span-2 min-h-[260px] lg:col-span-1 lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:min-h-0',
  'min-h-[180px] lg:col-start-2 lg:row-start-1 lg:min-h-0',
  'min-h-[180px] lg:col-start-2 lg:row-start-2 lg:min-h-0',
  'col-span-2 min-h-[260px] lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:row-span-2 lg:min-h-0',
  'min-h-[180px] lg:col-start-4 lg:row-start-1 lg:min-h-0',
  'min-h-[180px] lg:col-start-4 lg:row-start-2 lg:min-h-0',
];

export function ListingSkeleton({ count = 8, layout = 'grid' }: ListingSkeletonProps) {
  if (layout === 'tiles') {
    return (
      <div className={listingBrowseClass} aria-hidden>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="flex flex-col">
            <div className="aspect-square animate-pulse rounded-card bg-subtle" />
            <div className="mt-2 h-4 w-3/4 animate-pulse rounded-control bg-subtle" />
            <div className="mt-1 h-3 w-1/2 animate-pulse rounded-control bg-subtle" />
          </div>
        ))}
      </div>
    );
  }

  if (layout === 'mosaic') {
    return (
      <div className={listingMosaicClass} aria-hidden>
        {mosaicSlots.map((slot, index) => (
          <div key={index} className={`animate-pulse rounded-card bg-subtle ${slot}`} />
        ))}
      </div>
    );
  }

  const isRail = layout === 'rail';

  return (
    <div className={isRail ? listingRailClass : listingGridClass} aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`animate-pulse ${isRail ? listingRailItemClass : ''}`}>
          <div className={`bg-subtle ${isRail ? 'aspect-square' : 'aspect-[4/3]'} rounded-card mb-3`} />
          <div className="h-4 bg-subtle rounded-control w-3/4 mb-2" />
          <div className="h-3 bg-subtle rounded-control w-1/2 mb-2" />
          <div className="h-4 bg-subtle rounded-control w-1/3" />
        </div>
      ))}
    </div>
  );
}
