'use client';

import React, { useEffect, useState } from 'react';
import {
  CATEGORIES,
  CONDITIONS,
  CategoryNode,
  ListingType,
  categoriesForListingType,
  findCategory,
} from '@/lib/catalog';
import { CityOption, StateOption, fetchCities, fetchStates } from '@/lib/services/api';
import {
  btnPrimaryClass,
  btnSecondaryClass,
  errorBannerClass,
  fieldClass,
  helpClass,
  labelClass,
  metaClass,
} from '@/lib/ui-classes';

export const MAX_ITEM_IMAGES = 8;

export type ItemFormValues = {
  title: string;
  description: string;
  price: string;
  category: string;
  location: string;
  state_id: string;
  city_id: string;
  condition: string;
  listing_type: ListingType | '';
  brand?: string;
  model?: string;
  year?: string;
  mileage?: string;
  transmission?: string;
  property_type?: string;
  bedrooms?: string;
  bathrooms?: string;
  area_m2?: string;
  furnished?: string;
  pets_allowed?: string;
  listing_mode?: string;
};

export type ItemPhotoSlot = {
  key: string;
  url: string;
  existingId?: number;
};

interface ItemFormProps {
  values: ItemFormValues;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string;
  photos: ItemPhotoSlot[];
  onPhotosAdd: (files: FileList | null) => void;
  onPhotoRemove: (key: string) => void;
  maxPhotos?: number;
  submitLabel: string;
  secondaryAction?: React.ReactNode;
  imageHint?: string;
  categories?: CategoryNode[];
  hideCategory?: boolean;
  hideListingType?: boolean;
}

export function ItemForm({
  values,
  onChange,
  onSubmit,
  loading,
  error,
  photos,
  onPhotosAdd,
  onPhotoRemove,
  maxPhotos = MAX_ITEM_IMAGES,
  submitLabel,
  secondaryAction,
  imageHint = 'PNG, JPG, WebP ou GIF até 10MB cada',
  categories = CATEGORIES,
  hideCategory = false,
  hideListingType = false,
}: ItemFormProps) {
  const listingType = (values.listing_type || 'item') as ListingType;
  const available = categoriesForListingType(listingType, categories);
  const selected = values.category ? findCategory(values.category, categories) : undefined;
  const showCondition = listingType === 'item' || listingType === 'vehicle';
  const canAddMore = photos.length < maxPhotos;

  const [states, setStates] = useState<StateOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [cityQuery, setCityQuery] = useState('');
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchStates()
      .then((data) => {
        if (!cancelled) setStates(data || []);
      })
      .catch(() => {
        if (!cancelled) setStates([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!values.state_id) {
        setCities([]);
        return;
      }
      setLoadingCities(true);
      try {
        const data = await fetchCities(Number(values.state_id), cityQuery.trim() || undefined);
        if (!cancelled) setCities(data || []);
      } catch {
        if (!cancelled) setCities([]);
      } finally {
        if (!cancelled) setLoadingCities(false);
      }
    };
    const t = window.setTimeout(load, cityQuery ? 250 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [values.state_id, cityQuery]);

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (e.target.name === 'state_id') {
      onChange(e);
      onChange({
        ...e,
        target: { ...e.target, name: 'city_id', value: '' },
      } as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>);
      setCityQuery('');
      return;
    }
    onChange(e);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error ? (
        <div className={errorBannerClass} role="alert">
          {error}
        </div>
      ) : null}

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <span className={labelClass}>Fotos</span>
          <span className={metaClass}>
            {photos.length}/{maxPhotos}
          </span>
        </div>
        <div className="mt-1.5 rounded-card border border-dashed border-[color:var(--color-border)] bg-subtle p-4">
          {photos.length > 0 ? (
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {photos.map((photo, index) => (
                <li
                  key={photo.key}
                  className="relative aspect-square rounded-control overflow-hidden bg-surface border border-[color:var(--color-border)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" />
                  {index === 0 ? (
                    <span className="absolute left-2 top-2 rounded-sm bg-ink/80 px-1.5 py-0.5 type-meta text-white">
                      Capa
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onPhotoRemove(photo.key)}
                    className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-pill bg-surface/95 text-ink border border-[color:var(--color-border)] hover:bg-subtle"
                    aria-label={`Remover foto ${index + 1}`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {canAddMore ? (
            <div className="text-center py-2">
              <label htmlFor="file-upload" className={`${btnSecondaryClass} cursor-pointer inline-flex`}>
                {photos.length === 0 ? 'Adicionar fotos' : 'Adicionar mais fotos'}
                <input
                  id="file-upload"
                  type="file"
                  className="sr-only"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={(e) => {
                    onPhotosAdd(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
              <p className={helpClass}>
                Selecione várias de uma vez. {imageHint}. A primeira é a capa.
              </p>
            </div>
          ) : (
            <p className={`${helpClass} text-center`}>Limite de {maxPhotos} fotos atingido.</p>
          )}
        </div>
      </div>

      {!hideListingType ? (
        <div>
          <label htmlFor="listing_type" className={labelClass}>
            Tipo de anúncio
          </label>
          <select
            id="listing_type"
            name="listing_type"
            required
            value={values.listing_type || 'item'}
            onChange={handleFieldChange}
            className={fieldClass}
          >
            <option value="item">Item para venda</option>
            <option value="vehicle">Veículo para venda</option>
            <option value="property">Imóvel</option>
          </select>
        </div>
      ) : null}

      <div>
        <label htmlFor="title" className={labelClass}>
          Título
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          value={values.title}
          onChange={handleFieldChange}
          className={fieldClass}
          placeholder={
            listingType === 'vehicle'
              ? 'Ex: Honda Civic 2020'
              : listingType === 'property'
                ? 'Ex: Apartamento 2 quartos no Centro'
                : 'Ex: iPhone 13 Pro Max'
          }
        />
      </div>

      <div>
        <label htmlFor="price" className={labelClass}>
          {listingType === 'property' && values.listing_mode === 'rent' ? 'Aluguel mensal' : 'Preço'}
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center type-meta text-muted pointer-events-none">
            R$
          </span>
          <input
            type="text"
            inputMode="decimal"
            id="price"
            name="price"
            required
            value={values.price}
            onChange={handleFieldChange}
            className={`${fieldClass} pl-10`}
            placeholder="0,00 (use 0 para grátis)"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {!hideCategory ? (
          <div>
            <label htmlFor="category" className={labelClass}>
              Categoria
            </label>
            <select
              id="category"
              name="category"
              required
              value={values.category}
              onChange={onChange}
              className={fieldClass}
            >
              <option value="">Selecione uma categoria</option>
              {available.map((category) => (
                <optgroup key={category.slug} label={category.name}>
                  <option value={category.slug}>{category.name}</option>
                  {(category.children || []).map((child) => (
                    <option key={child.slug} value={child.slug}>
                      {category.name} — {child.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {selected ? <p className={helpClass}>Selecionado: {selected.name}</p> : null}
          </div>
        ) : null}

        {showCondition ? (
          <div>
            <label htmlFor="condition" className={labelClass}>
              Condição
            </label>
            <select
              id="condition"
              name="condition"
              required
              value={values.condition}
              onChange={onChange}
              className={fieldClass}
            >
              {CONDITIONS.map((condition) => (
                <option key={condition.value} value={condition.value}>
                  {condition.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {listingType === 'vehicle' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="brand" className={labelClass}>
              Marca
            </label>
            <input
              id="brand"
              name="brand"
              value={values.brand || ''}
              onChange={onChange}
              className={fieldClass}
              placeholder="Ex: Toyota"
            />
          </div>
          <div>
            <label htmlFor="model" className={labelClass}>
              Modelo
            </label>
            <input
              id="model"
              name="model"
              value={values.model || ''}
              onChange={onChange}
              className={fieldClass}
              placeholder="Ex: Corolla"
            />
          </div>
          <div>
            <label htmlFor="year" className={labelClass}>
              Ano
            </label>
            <input
              id="year"
              name="year"
              value={values.year || ''}
              onChange={onChange}
              className={fieldClass}
              placeholder="Ex: 2019"
            />
          </div>
          <div>
            <label htmlFor="mileage" className={labelClass}>
              Quilometragem
            </label>
            <input
              id="mileage"
              name="mileage"
              value={values.mileage || ''}
              onChange={onChange}
              className={fieldClass}
              placeholder="Ex: 45000"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="transmission" className={labelClass}>
              Câmbio
            </label>
            <select
              id="transmission"
              name="transmission"
              value={values.transmission || ''}
              onChange={onChange}
              className={fieldClass}
            >
              <option value="">Selecione</option>
              <option value="manual">Manual</option>
              <option value="automatic">Automático</option>
            </select>
          </div>
        </div>
      ) : null}

      {listingType === 'property' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="listing_mode" className={labelClass}>
              Finalidade
            </label>
            <select
              id="listing_mode"
              name="listing_mode"
              value={values.listing_mode || 'sale'}
              onChange={onChange}
              className={fieldClass}
            >
              <option value="sale">Venda</option>
              <option value="rent">Locação</option>
            </select>
          </div>
          <div>
            <label htmlFor="property_type" className={labelClass}>
              Tipo de imóvel
            </label>
            <select
              id="property_type"
              name="property_type"
              value={values.property_type || ''}
              onChange={onChange}
              className={fieldClass}
            >
              <option value="">Selecione</option>
              <option value="apartment">Apartamento</option>
              <option value="house">Casa</option>
              <option value="room">Quarto</option>
              <option value="land">Terreno</option>
              <option value="other">Outro</option>
            </select>
          </div>
          <div>
            <label htmlFor="bedrooms" className={labelClass}>
              Quartos
            </label>
            <input
              id="bedrooms"
              name="bedrooms"
              value={values.bedrooms || ''}
              onChange={onChange}
              className={fieldClass}
              placeholder="Ex: 2"
            />
          </div>
          <div>
            <label htmlFor="bathrooms" className={labelClass}>
              Banheiros
            </label>
            <input
              id="bathrooms"
              name="bathrooms"
              value={values.bathrooms || ''}
              onChange={onChange}
              className={fieldClass}
              placeholder="Ex: 1"
            />
          </div>
          <div>
            <label htmlFor="area_m2" className={labelClass}>
              Área (m²)
            </label>
            <input
              id="area_m2"
              name="area_m2"
              value={values.area_m2 || ''}
              onChange={onChange}
              className={fieldClass}
              placeholder="Ex: 70"
            />
          </div>
          <div>
            <label htmlFor="furnished" className={labelClass}>
              Mobília
            </label>
            <select
              id="furnished"
              name="furnished"
              value={values.furnished || ''}
              onChange={onChange}
              className={fieldClass}
            >
              <option value="">Não informado</option>
              <option value="yes">Mobiliado</option>
              <option value="no">Sem mobília</option>
              <option value="partial">Parcial</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="pets_allowed" className={labelClass}>
              Aceita pets
            </label>
            <select
              id="pets_allowed"
              name="pets_allowed"
              value={values.pets_allowed || ''}
              onChange={onChange}
              className={fieldClass}
            >
              <option value="">Não informado</option>
              <option value="yes">Sim</option>
              <option value="no">Não</option>
            </select>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="state_id" className={labelClass}>
            Estado
          </label>
          <select
            id="state_id"
            name="state_id"
            required
            value={values.state_id}
            onChange={handleFieldChange}
            className={fieldClass}
          >
            <option value="">Selecione o estado</option>
            {states.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="city_id" className={labelClass}>
            Cidade
          </label>
          <select
            id="city_id"
            name="city_id"
            required
            value={values.city_id}
            onChange={handleFieldChange}
            disabled={!values.state_id || loadingCities}
            className={fieldClass}
          >
            <option value="">
              {!values.state_id
                ? 'Escolha o estado primeiro'
                : loadingCities
                  ? 'Carregando...'
                  : 'Selecione a cidade'}
            </option>
            {cities.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
          {values.state_id ? (
            <input
              type="search"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              className={`${fieldClass} mt-2`}
              placeholder="Filtrar cidades..."
              aria-label="Filtrar cidades"
            />
          ) : null}
          <p className={helpClass}>A cidade aparece no anúncio, como no Marketplace.</p>
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          required
          value={values.description}
          onChange={onChange}
          className={fieldClass}
          placeholder="Descreva os detalhes do seu anúncio..."
        />
      </div>

      <div className="pt-2 flex flex-col-reverse sm:flex-row gap-3">
        {secondaryAction}
        <button type="submit" disabled={loading} className={`${btnPrimaryClass} flex-1`}>
          {loading ? 'Salvando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
