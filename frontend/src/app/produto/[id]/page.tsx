import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { API_URL, SITE_URL } from '@/lib/site';
import { resolveImageUrl, type Item } from '@/lib/services/api';
import { categoryLabel, parentOfSlug } from '@/lib/catalog';
import { ProductDetailClient } from '@/components/product/ProductDetailClient';

// Server-side fetch straight to the Go backend (no axios/apiService, which is
// client-only) so the item is available for both generateMetadata and the
// page render without waiting on browser JS. Sold/paused items already 404
// on the backend for anonymous requests (see handlers/item_details.go), so
// this naturally 404s here too instead of the old client-only "not found" UI.
async function getItem(id: string): Promise<Item | null> {
  try {
		const res = await fetch(`${API_URL}/items/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as Item;
  } catch {
    return null;
  }
}

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) {
    return { title: 'Anúncio não encontrado' };
  }

  const description = (item.description || '').replace(/\s+/g, ' ').trim().slice(0, 155);
  const image = resolveImageUrl(item.image_url);
  const url = `${SITE_URL}/produto/${item.id}`;

  return {
    title: item.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title: item.title,
      description,
      url,
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      title: item.title,
      description,
      images: [image],
    },
  };
}

export default async function ProductDetailsPage({ params }: { params: Params }) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();

  const url = `${SITE_URL}/produto/${item.id}`;
  const parent = item.category ? parentOfSlug(item.category) : undefined;
  const isNew = /novo/i.test(item.condition || '');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: item.title,
        description: item.description,
        image: resolveImageUrl(item.image_url),
        category: categoryLabel(item.category),
        offers: {
          '@type': 'Offer',
          url,
          priceCurrency: 'BRL',
          price: item.price,
          availability: 'https://schema.org/InStock',
          itemCondition: isNew ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          ...(parent
            ? [
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: categoryLabel(parent.slug),
                  item: `${SITE_URL}/geral?category=${parent.slug}`,
                },
              ]
            : []),
          {
            '@type': 'ListItem',
            position: parent ? 3 : 2,
            name: item.title,
            item: url,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient initialItem={item} />
    </>
  );
}
