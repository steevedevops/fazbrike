import React from 'react';
import { ProductTile } from '@/components/ProductTile';
import { listingMosaicClass, listingTileRowClass } from '@/lib/ui-classes';

export interface MosaicItem {
  id: number;
  title: string;
  price: number;
  image_url?: string;
  category?: string;
  location?: string;
  views_count?: number;
}

const mosaicSlots = [
  'col-span-2 min-h-[260px] lg:col-span-1 lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:min-h-0',
  'min-h-[180px] lg:col-start-2 lg:row-start-1 lg:min-h-0',
  'min-h-[180px] lg:col-start-2 lg:row-start-2 lg:min-h-0',
  'col-span-2 min-h-[260px] lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:row-span-2 lg:min-h-0',
  'min-h-[180px] lg:col-start-4 lg:row-start-1 lg:min-h-0',
  'min-h-[180px] lg:col-start-4 lg:row-start-2 lg:min-h-0',
];

function tileFor(item: MosaicItem) {
  return (
    <ProductTile
      id={item.id}
      price={item.price}
      name={item.title}
      imageUrl={item.image_url}
      category={item.category}
      location={item.location}
      viewsCount={item.views_count || 0}
    />
  );
}

export function ProductTileRow({ items }: { items: MosaicItem[] }) {
  return (
    <div className={listingTileRowClass}>
      {items.map((item) => (
        <div key={item.id} className="aspect-square">
          {tileFor(item)}
        </div>
      ))}
    </div>
  );
}

export function ProductMosaic({ items }: { items: MosaicItem[] }) {
  if (items.length < 6) {
    return <ProductTileRow items={items} />;
  }

  return (
    <div className={listingMosaicClass}>
      {items.slice(0, 6).map((item, index) => (
        <div key={item.id} className={mosaicSlots[index]}>
          {tileFor(item)}
        </div>
      ))}
    </div>
  );
}

export function ProductMosaicList({ items }: { items: MosaicItem[] }) {
  const bands: MosaicItem[][] = [];
  for (let index = 0; index < items.length; index += 6) {
    bands.push(items.slice(index, index + 6));
  }

  return (
    <div className="flex flex-col gap-10">
      {bands.map((band) => (
        <ProductMosaic key={band.map((item) => item.id).join('-')} items={band} />
      ))}
    </div>
  );
}
