export type BrowseSort = 'recent' | 'price_asc' | 'price_desc';

export interface BrowseExtras {
  category?: string;
  search?: string;
  sort?: BrowseSort;
}

export function buildItemQuery(params: URLSearchParams, extras: BrowseExtras = {}): string {
  const next = new URLSearchParams();
  const search = extras.search ?? params.get('q') ?? params.get('search');
  const category = extras.category ?? params.get('category');
  const condition = params.get('condition');
  const listingType = params.get('listing_type');
  const location = params.get('location');
  const cityId = params.get('city_id');
  const stateId = params.get('state_id');
  const minPrice = params.get('min_price');
  const maxPrice = params.get('max_price');

  if (search) next.set('search', search);
  if (category) next.set('category', category);
  if (condition) next.set('condition', condition);
  if (listingType) next.set('listing_type', listingType);
  if (cityId) next.set('city_id', cityId);
  else if (stateId) next.set('state_id', stateId);
  else if (location) next.set('location', location);
  if (minPrice) next.set('min_price', minPrice);
  if (maxPrice) next.set('max_price', maxPrice);

  const urlSort = params.get('sort_by');
  if (urlSort === 'price') {
    next.set('sort_by', 'price');
    next.set('order', params.get('order') === 'desc' ? 'desc' : 'asc');
  } else if (urlSort === 'date') {
    next.set('sort_by', 'date');
    next.set('order', params.get('order') === 'asc' ? 'asc' : 'desc');
  } else if (extras.sort === 'price_asc') {
    next.set('sort_by', 'price');
    next.set('order', 'asc');
  } else if (extras.sort === 'price_desc') {
    next.set('sort_by', 'price');
    next.set('order', 'desc');
  }

  return next.toString();
}

export function currentBrowseSort(params: URLSearchParams, fallback: BrowseSort = 'recent'): BrowseSort {
  const sortBy = params.get('sort_by');
  if (sortBy === 'price') {
    return params.get('order') === 'desc' ? 'price_desc' : 'price_asc';
  }
  if (sortBy === 'date') return 'recent';
  return fallback;
}

