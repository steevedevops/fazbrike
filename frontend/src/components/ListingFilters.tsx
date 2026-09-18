'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CategoryIcon } from '@/components/CategoryIcon';
import { CATEGORIES, CONDITIONS, LISTING_TYPES, categoryLabel, conditionLabel, findCategory, parsePriceInput, parentOfSlug } from '@/lib/catalog';
import { CityOption, StateOption, fetchCities, fetchStates } from '@/lib/services/api';
import {
  btnGhostClass,
  btnSecondaryClass,
  chipClass,
  cx,
  fieldClass,
  labelClass,
  metaClass,
  panelClass,
} from '@/lib/ui-classes';

interface ListingFiltersProps {
  lockedCategory?: string;
  onApplied?: () => void;
}

const CATEGORY_PREVIEW_COUNT = 8;

const PRICE_PRESETS = [
  { label: 'Até R$ 100', min: '', max: '100' },
  { label: 'R$ 100 a R$ 500', min: '100', max: '500' },
  { label: 'R$ 500 a R$ 2.000', min: '500', max: '2000' },
  { label: 'Acima de R$ 2.000', min: '2000', max: '' },
];

function FilterSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-[color:var(--color-border)] pt-5 first:border-t-0 first:pt-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="type-meta font-semibold text-ink">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function OptionPill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        'flex w-full min-h-11 items-center gap-2.5 rounded-control border px-3 text-left type-meta transition-colors',
        selected
          ? 'border-brand-500 bg-brand-50 text-ink font-medium'
          : 'border-[color:var(--color-border)] text-ink hover:border-ink/25'
      )}
    >
      <span
        aria-hidden
        className={cx(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-pill border',
          selected ? 'border-brand-500' : 'border-[color:var(--color-border)]'
        )}
      >
        {selected ? <span className="h-2 w-2 rounded-pill bg-brand-500" /> : null}
      </span>
      {children}
    </button>
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

  const pushParams = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
    onApplied?.();
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

  const applyRange = (event: React.FormEvent) => {
    event.preventDefault();
    pushParams((params) => {
      const min = parsePriceInput(minPrice);
      const max = parsePriceInput(maxPrice);
      if (min !== null) params.set('min_price', String(min));
      else params.delete('min_price');
      if (max !== null) params.set('max_price', String(max));
      else params.delete('max_price');
      params.delete('location');
      if (cityId) {
        params.set('city_id', cityId);
        if (stateId) params.set('state_id', stateId);
      } else if (stateId) {
        params.delete('city_id');
        params.set('state_id', stateId);
      } else {
        params.delete('city_id');
        params.delete('state_id');
      }
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

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="type-meta font-semibold text-ink">Filtros</h2>
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
            className="type-meta font-medium text-danger hover:underline"
          >
            Limpar tudo
          </button>
        ) : null}
      </div>

      <FilterSection title="Tipo de anúncio">
        <div className="inline-flex w-full rounded-pill bg-subtle p-1">
          <button
            type="button"
            onClick={() => setFilter('listing_type', '')}
            className={cx(
              'flex-1 min-h-9 rounded-pill px-3 type-meta transition-colors',
              !selectedListingType ? 'bg-surface font-semibold text-ink shadow-card' : 'text-muted hover:text-ink'
            )}
          >
            Todos
          </button>
          {LISTING_TYPES.map((t) => {
            const active = selectedListingType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setFilter('listing_type', active ? '' : t.value)}
                className={cx(
                  'flex-1 min-h-9 rounded-pill px-3 type-meta transition-colors',
                  active ? 'bg-surface font-semibold text-ink shadow-card' : 'text-muted hover:text-ink'
                )}
              >
                {t.value === 'item' ? 'Itens' : t.value === 'vehicle' ? 'Veículos' : 'Imóveis'}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Categoria">
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => setCategory('')}
            className={cx(
              'flex min-h-10 items-center gap-2.5 rounded-control px-2.5 text-left type-meta transition-colors',
              !selectedCategory ? 'bg-subtle font-semibold text-ink' : 'text-muted hover:bg-subtle hover:text-ink'
            )}
          >
            Todas as categorias
          </button>
          {visibleCategories.map((category) => {
            const active =
              selectedCategory === category.slug ||
              !!category.children?.some((child) => child.slug === selectedCategory);
            return (
              <button
                key={category.slug}
                type="button"
                onClick={() => setCategory(category.slug)}
                className={cx(
                  'flex min-h-10 items-center gap-2.5 rounded-control px-2.5 text-left type-meta transition-colors',
                  active ? 'bg-subtle font-semibold text-ink' : 'text-muted hover:bg-subtle hover:text-ink'
                )}
              >
                <CategoryIcon
                  slug={category.icon || category.slug}
                  className={cx('h-4 w-4 shrink-0', active ? 'text-brand-500' : 'text-muted')}
                />
                {category.name}
              </button>
            );
          })}
        </div>

        {CATEGORIES.length > CATEGORY_PREVIEW_COUNT ? (
          <button
            type="button"
            onClick={() => setShowAllCategories((value) => !value)}
            className="mt-2 type-meta font-medium text-brand-500 hover:text-brand-600"
          >
            {showAllCategories ? 'Ver menos' : `Ver todas as categorias (${CATEGORIES.length})`}
          </button>
        ) : null}

        {subcategoryNode?.children?.length ? (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-[color:var(--color-border)] pt-3">
            {subcategoryNode.children.map((child) => {
              const active = selectedCategory === child.slug;
              return (
                <button
                  key={child.slug}
                  type="button"
                  onClick={() => setCategory(active ? subcategoryNode.slug : child.slug)}
                  className={cx(
                    chipClass,
                    active && 'border-brand-500 bg-brand-50 font-medium'
                  )}
                >
                  {child.name}
                </button>
              );
            })}
          </div>
        ) : null}
      </FilterSection>

      <FilterSection title="Preço">
        <form onSubmit={applyRange} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="filtro-preco-min" className={labelClass}>
                Preço mín.
              </label>
              <input
                id="filtro-preco-min"
                type="text"
                inputMode="decimal"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                placeholder="R$"
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="filtro-preco-max" className={labelClass}>
                Preço máx.
              </label>
              <input
                id="filtro-preco-max"
                type="text"
                inputMode="decimal"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="R$"
                className={fieldClass}
              />
            </div>
          </div>
          <button type="submit" className={cx(btnSecondaryClass, 'w-full')}>
            Aplicar preço
          </button>
        </form>

        <div className="mt-3 flex flex-col gap-2">
          {PRICE_PRESETS.map((preset) => {
            const selected =
              (searchParams.get('min_price') || '') === preset.min &&
              (searchParams.get('max_price') || '') === preset.max;
            return (
              <OptionPill
                key={preset.label}
                selected={selected}
                onClick={() => applyPricePreset(selected ? { min: '', max: '' } : preset)}
              >
                {preset.label}
              </OptionPill>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Condição">
        <div className="flex flex-col gap-2">
          {CONDITIONS.map((condition) => {
            const active = selectedCondition === condition.value;
            return (
              <OptionPill
                key={condition.value}
                selected={active}
                onClick={() => setFilter('condition', active ? '' : condition.value)}
              >
                {condition.label}
              </OptionPill>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Localização">
        <form onSubmit={applyRange} className="flex flex-col gap-3">
          <div>
            <label htmlFor="filtro-estado" className={labelClass}>
              Estado
            </label>
            <select
              id="filtro-estado"
              value={stateId}
              onChange={(event) => {
                setStateId(event.target.value);
                setCityId('');
              }}
              className={fieldClass}
            >
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
              onChange={(event) => setCityId(event.target.value)}
              disabled={!stateId}
              className={fieldClass}
            >
              <option value="">{stateId ? 'Todas do estado' : 'Escolha o estado'}</option>
              {cities.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={cx(btnSecondaryClass, 'w-full')}>
            Aplicar localização
          </button>
        </form>
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="mb-5 lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={btnGhostClass}
        aria-expanded={open}
      >
        Filtros
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
            <div className="flex items-center justify-between gap-3 border-b border-[color:var(--color-border)] px-4 py-3">
              <p className="type-meta font-semibold text-ink">Filtros</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="type-meta text-muted hover:text-ink"
              >
                Fechar
              </button>
            </div>
            <div className="p-4">
              <ListingFilters lockedCategory={lockedCategory} onApplied={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
