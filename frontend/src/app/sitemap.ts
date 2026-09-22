import type { MetadataRoute } from "next";
import { API_URL, SITE_URL } from "@/lib/site";
import type { Item } from "@/lib/services/api";

// GET /items already filters to status="active" server-side, so sold/paused
// listings are naturally excluded here without any extra filtering.
async function fetchActiveItems(): Promise<Item[]> {
  try {
    const res = await fetch(`${API_URL}/items`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return (await res.json()) as Item[];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/buscar`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/ofertas`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/vender`, changeFrequency: "monthly", priority: 0.3 },
  ];

  const items = await fetchActiveItems();
  const itemRoutes: MetadataRoute.Sitemap = items.map((item) => ({
    url: `${SITE_URL}/produto/${item.id}`,
    lastModified: item.updated_at ? new Date(item.updated_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...itemRoutes];
}
