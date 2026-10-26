'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CategoryIcon } from '@/components/CategoryIcon';
import { CATEGORIES, CONDITIONS, LISTING_TYPES, categoryLabel, conditionLabel, findCategory, parsePriceInput, parentOfSlug } from '@/lib/catalog';
import { CityOption, StateOption, fetchCities, fetchStates } from '@/lib/services/api';
import { btnSecondaryClass, chipClass, cx, fieldClass, labelClass, metaClass, panelClass } from '@/lib/ui-classes';

interface ListingFiltersProps {
  lockedCategory?: string;
  onApplied?: () => void;
}

const CATEGORY_PREVIEW_COUNT = 8;

const PRICE_PRESETS = [
  { label: 'Até R$ 100', min: '', max: '100' },
  { label: 'R$ 100 a 500', min: '100', max: '500' },
  { label: 'R$ 500 a 2.000', min: '500', max: '2000' },
  { label: 'Acima de R$ 2.000', min: '2000', max: '' },
];

const LISTING_TYPE_SHORT: Record<string, string> = { item: 'Itens', vehicle: 'Veículos', property: 'Imóveis' };

// Um único padrão para toda opção de filtro: chip monocromático, ativo em tinta.
const filterChipClass = (active: boolean) =>
  cx(
    'inline-flex min-h-8 items-center justify-center rounded-pill border px-3 type-meta transition-colors',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1',
    active
      ? 'border-ink bg-ink font-medium text-white'
      : 'border-[color:var(--color-border)] bg-surface text-ink hover:border-ink/30'
  );

const rowClass = (active: boolean) =>
  cx(
    'flex w-full min-h-9 items-center gap-2.5 rounded-control px-2.5 text-left type-meta transition-colors',
    active ? 'bg-subtle font-semibold text-ink' : 'text-muted hover:bg-subtle hover:text-ink'
  );

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[color:var(--color-border)] pt-5">
      <h3 className="mb-3 type-meta font-semibold uppercase tracking-wide text-ink">{title}</h3>
      {children}
    </section>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z" />
    </svg>
  );
}

export function ListingFilters({ lockedCategory, onApplied }: ListingFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedCategory = lockedCategory || searchParams.get('category') || '';
  const selectedCondition = searchParams.get('condition') || '';
  const selectedListingType = searchParams.get('listing_type') || '';
  const [stateId, setStateId] = useState(searchParams.get('state_id') || '');
  const [cityId, setCityId] = useState(searchParams.get('city_id') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [states, setStates] = useState<StateOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const activeCount = ['category', 'listing_type', 'condition', 'city_id', 'state_id', 'min_price', 'max_price']
    .filter((key) => !!searchParams.get(key)).length;

  useEffect(() => {
    setStateId(searchParams.get('state_id') || '');
    setCityId(searchParams.get('city_id') || '');
    setMinPrice(searchParams.get('min_price') || '');
    setMaxPrice(searchParams.get('max_price') || '');
  }, [searchParams]);

  useEffect(() => {
    fetchStates()
      .then((data) => setStates(data || []))
      .catch(() => setStates([]));
  }, []);

  useEffect(() => {
    if (!stateId) {
      setCities([]);
      return;
    }
    fetchCities(Number(stateId))
      .then((data) => setCities(data || []))
      .catch(() => setCities([]));
  }, [stateId]);

  // keepOpen: na gaveta do celular, escolher o estado não fecha o painel
  // (a pessoa ainda vai escolher a cidade).
  const pushParams = (mutate: (params: URLSearchParams) => void, keepOpen = false) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
    if (!keepOpen) onApplied?.();
  };

  const setFilter = (key: string, value: string) => {
    pushParams((params) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
  };

  const setCategory = (slug: string) => {
    if (pathname.startsWith('/categoria/')) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('category');
      const query = params.toString();
      if (!slug) {
        router.push(query ? `/geral?${query}` : '/geral');
      } else {
        router.push(query ? `/categoria/${slug}?${query}` : `/categoria/${slug}`);
      }
      onApplied?.();
      return;
    }
    setFilter('category', slug);
  };

  const applyPricePreset = (preset: { min: string; max: string }) => {
    pushParams((params) => {
      if (preset.min) params.set('min_price', preset.min);
      else params.delete('min_price');
      if (preset.max) params.set('max_price', preset.max);
      else params.delete('max_price');
    });
  };

  const applyPrice = (event: React.FormEvent) => {
    event.preventDefault();
    pushParams((params) => {
      const min = parsePriceInput(minPrice);
      const max = parsePriceInput(maxPrice);
      if (min !== null) params.set('min_price', String(min));
      else params.delete('min_price');
      if (max !== null) params.set('max_price', String(max));
      else params.delete('max_price');
    });
  };

  const applyState = (value: string) => {
    setStateId(value);
    setCityId('');
    pushParams((params) => {
      params.delete('location');
      params.delete('city_id');
      if (value) params.set('state_id', value);
      else params.delete('state_id');
    }, true);
  };

  const applyCity = (value: string) => {
    setCityId(value);
    pushParams((params) => {
      params.delete('location');
      if (value) params.set('city_id', value);
      else params.delete('city_id');
      if (stateId) params.set('state_id', stateId);
    });
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    const search = searchParams.get('q');
    if (search) params.set('q', search);
    if (pathname.startsWith('/categoria/') && lockedCategory) {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    } else {
      params.delete('category');
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    }
    onApplied?.();
  };

  const visibleCategories = (() => {
    if (showAllCategories) return CATEGORIES;
    const head = CATEGORIES.slice(0, CATEGORY_PREVIEW_COUNT);
    const selectedTop = CATEGORIES.find(
      (category) =>
        category.slug === selectedCategory ||
        category.children?.some((child) => child.slug === selectedCategory)
    );
    return selectedTop && !head.includes(selectedTop) ? [...head, selectedTop] : head;
  })();

  const subcategoryNode = (() => {
    const parent =
      (selectedCategory && findCategory(selectedCategory)?.children?.length
        ? findCategory(selectedCategory)
        : parentOfSlug(selectedCategory || '')) || undefined;
    return parent || findCategory(selectedCategory || '');
  })();

  const priceSelected = (preset: { min: string; max: string }) =>
    (searchParams.get('min_price') || '') === preset.min && (searchParams.get('max_price') || '') === preset.max;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="type-title text-ink">Filtros</h2>
          <p className={metaClass}>
            {activeCount === 0
              ? 'Nenhum filtro aplicado'
              : `${activeCount} ${activeCount === 1 ? 'filtro aplicado' : 'filtros aplicados'}`}
          </p>
        </div>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={clearFilters}
            className="shrink-0 type-meta font-medium text-ink underline underline-offset-4 hover:text-muted"
          >
            Limpar tudo
          </button>
        ) : null}
      </div>

      <FilterSection title="Preço">
        <form onSubmit={applyPrice}>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="min-w-0">
              <label htmlFor="filtro-preco-min" className="sr-only">
                Preço mínimo
              </label>
              <input
                id="filtro-preco-min"
                type="text"
                inputMode="decimal"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                placeholder="Mín."
                className={fieldClass}
              />
            </div>
            <span className="type-meta text-muted" aria-hidden>
              até
            </span>
            <div className="min-w-0">
              <label htmlFor="filtro-preco-max" className="sr-only">
                Preço máximo
              </label>
              <input
                id="filtro-preco-max"
                type="text"
                inputMode="decimal"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="Máx."
                className={fieldClass}
              />
            </div>
          </div>
          <button type="submit" className={cx(btnSecondaryClass, 'mt-2 w-full')}>
            Aplicar preço
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRICE_PRESETS.map((preset) => {
            const selected = priceSelected(preset);
            return (
              <button
                key={preset.label}
                type="button"
                aria-pressed={selected}
                onClick={() => applyPricePreset(selected ? { min: '', max: '' } : preset)}
                className={filterChipClass(selected)}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Localização">
        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="filtro-estado" className={labelClass}>
              Estado
            </label>
            <select id="filtro-estado" value={stateId} onChange={(event) => applyState(event.target.value)} className={fieldClass}>
              <option value="">Todos os estados</option>
              {states.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filtro-cidade" className={labelClass}>
              Cidade
            </label>
            <select
              id="filtro-cidade"
              value={cityId}
              onChange={(event) => applyCity(event.target.value)}
              disabled={!stateId}
              className={cx(fieldClass, 'disabled:cursor-not-allowed disabled:opacity-60')}
            >
              <option value="">{stateId ? 'Todas do estado' : 'Escolha o estado primeiro'}</option>
              {cities.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Categoria">
        <div className="flex flex-col gap-0.5">
          <button type="button" onClick={() => setCategory('')} className={rowClass(!selectedCategory)}>
            <GridIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">Todas as categorias</span>
          </button>
          {visibleCategories.map((category) => {
            const active =
              selectedCategory === category.slug ||
              !!category.children?.some((child) => child.slug === selectedCategory);
            return (
              <React.Fragment key={category.slug}>
                <button type="button" onClick={() => setCategory(category.slug)} className={rowClass(active)}>
                  <CategoryIcon slug={category.icon || category.slug} className="h-4 w-4 shrink-0" />
                  <span className="truncate">{category.name}</span>
                </button>
                {/* Subcategorias logo abaixo da categoria ativa, recuadas. */}
                {active && subcategoryNode?.slug === category.slug && subcategoryNode.children?.length ? (
                  <div className="flex flex-wrap gap-2 py-2 pl-9">
                    {subcategoryNode.children.map((child) => {
                      const childActive = selectedCategory === child.slug;
                      return (
                        <button
                          key={child.slug}
                          type="button"
                          aria-pressed={childActive}
                          onClick={() => setCategory(childActive ? subcategoryNode.slug : child.slug)}
                          className={filterChipClass(childActive)}
                        >
                          {child.name}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </React.Fragment>
            );
          })}
          {CATEGORIES.length > CATEGORY_PREVIEW_COUNT ? (
            <button
              type="button"
              onClick={() => setShowAllCategories((value) => !value)}
              aria-expanded={showAllCategories}
              className="flex w-full min-h-9 items-center gap-2.5 rounded-control px-2.5 text-left type-meta font-medium text-ink transition-colors hover:bg-subtle"
            >
              <svg
                className={cx('h-4 w-4 shrink-0 transition-transform', showAllCategories && 'rotate-180')}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {showAllCategories ? 'Mostrar menos' : `Ver todas (${CATEGORIES.length})`}
            </button>
          ) : null}
        </div>
      </FilterSection>

      <FilterSection title="Condição">
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((condition) => {
            const active = selectedCondition === condition.value;
            return (
              <button
                key={condition.value}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter('condition', active ? '' : condition.value)}
                className={filterChipClass(active)}
              >
                {condition.label}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Tipo de anúncio">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={!selectedListingType}
            onClick={() => setFilter('listing_type', '')}
            className={filterChipClass(!selectedListingType)}
          >
            Todos
          </button>
          {LISTING_TYPES.map((t) => {
            const active = selectedListingType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter('listing_type', active ? '' : t.value)}
                className={filterChipClass(active)}
              >
                {LISTING_TYPE_SHORT[t.value] ?? t.label}
              </button>
            );
          })}
        </div>
      </FilterSection>
    </div>
  );
}

export function ActiveFilterChips({ lockedCategory }: { lockedCategory?: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [placeLabel, setPlaceLabel] = useState('');

  useEffect(() => {
    let cancelled = false;
    const cityId = searchParams.get('city_id');
    const stateId = searchParams.get('state_id');
    (async () => {
      if (!cityId && !stateId) {
        if (!cancelled) setPlaceLabel('');
        return;
      }
      try {
        const states = await fetchStates();
        const st = states.find((s) => String(s.id) === stateId);
        if (cityId && stateId) {
          const cities = await fetchCities(Number(stateId));
          const city = cities.find((c) => String(c.id) === cityId);
          if (!cancelled) {
            setPlaceLabel(city ? `${city.name}, ${st?.code || ''}`.trim() : st ? st.name : '');
          }
        } else if (st) {
          if (!cancelled) setPlaceLabel(st.name);
        }
      } catch {
        if (!cancelled) setPlaceLabel('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const chips: Array<{ key: string; label: string }> = [];
  const category = lockedCategory || searchParams.get('category');
  if (category && !lockedCategory) chips.push({ key: 'category', label: categoryLabel(category) });
  const listingType = searchParams.get('listing_type');
  if (listingType) {
    const lt = LISTING_TYPES.find((t) => t.value === listingType);
    chips.push({ key: 'listing_type', label: lt?.label || listingType });
  }
  const condition = searchParams.get('condition');
  if (condition) chips.push({ key: 'condition', label: conditionLabel(condition) });
  const cityIdChip = searchParams.get('city_id');
  const stateIdChip = searchParams.get('state_id');
  if (cityIdChip) chips.push({ key: 'city_id', label: placeLabel || 'Cidade' });
  else if (stateIdChip) chips.push({ key: 'state_id', label: placeLabel || 'Estado' });
  const location = searchParams.get('location');
  if (location) chips.push({ key: 'location', label: location });
  const minPrice = searchParams.get('min_price');
  if (minPrice) chips.push({ key: 'min_price', label: `A partir de R$ ${minPrice}` });
  const maxPrice = searchParams.get('max_price');
  if (maxPrice) chips.push({ key: 'max_price', label: `Até R$ ${maxPrice}` });

  if (chips.length === 0) return null;

  const remove = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    if (key === 'state_id') {
      params.delete('city_id');
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="mb-5 flex flex-wrap gap-2" aria-label="Filtros ativos">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => remove(chip.key)}
          className={chipClass}
        >
          {chip.label}
          <span aria-hidden>×</span>
        </button>
      ))}
    </div>
  );
}

export function MobileFilters({ lockedCategory }: { lockedCategory?: string }) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const activeCount = ['category', 'listing_type', 'condition', 'city_id', 'state_id', 'min_price', 'max_price']
    .filter((key) => !!searchParams.get(key)).length;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="mb-5 lg:hidden">
      <button type="button" onClick={() => setOpen(true)} className={chipClass} aria-expanded={open}>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M7 12h10M10 18h4" />
        </svg>
        Filtros
        {activeCount > 0 ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-pill bg-ink px-1.5 text-[11px] font-semibold text-white">
            {activeCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Fechar filtros"
            onClick={() => setOpen(false)}
          />
          <aside className={`absolute inset-y-0 left-0 w-[min(100%,21rem)] overflow-y-auto ${panelClass} rounded-none border-y-0 border-l-0 bg-surface p-0 shadow-soft`}>
            {/* O título "Filtros" já vem do painel; aqui só o fechar. */}
            <div className="flex justify-end px-4 pt-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1.5 type-meta font-medium text-muted hover:text-ink"
              >
                Fechar
                <span aria-hidden>×</span>
              </button>
            </div>
            <div className="px-4 pb-6 pt-1">
              <ListingFilters lockedCategory={lockedCategory} onApplied={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
