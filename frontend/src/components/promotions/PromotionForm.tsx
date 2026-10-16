'use client';

import React, { useMemo, useState } from 'react';
import {
  apiService,
  resolveImageUrl,
  type Item,
  type MyPromotion,
  type PromotionRequest,
  type PromotionTargetType,
} from '@/lib/services/api';
import { CATEGORIES } from '@/lib/catalog';
import {
  btnGhostClass,
  btnInkClass,
  cx,
  errorBannerClass,
  fieldClass,
  labelClass,
  metaClass,
} from '@/lib/ui-classes';

const TARGETS: Array<{ type: PromotionTargetType; label: string; hint: string }> = [
  { type: 'profile', label: 'Minha loja', hint: 'Quem clicar cai no seu perfil, sem sair da plataforma.' },
  { type: 'item', label: 'Um anúncio meu', hint: 'O banner abre o anúncio escolhido.' },
  { type: 'category', label: 'Categoria', hint: 'Abre a vitrine da categoria.' },
  { type: 'search', label: 'Busca', hint: 'Abre a busca pelo termo que você escrever.' },
  { type: 'none', label: 'Sem destino', hint: 'O banner aparece, mas não abre nada.' },
];

interface PromotionFormProps {
  promotion?: MyPromotion | null;
  items: Item[];
  onSaved: () => void;
  onCancel: () => void;
}

function toDateInput(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

export function PromotionForm({ promotion, items, onSaved, onCancel }: PromotionFormProps) {
  const [title, setTitle] = useState(promotion?.title ?? '');
  const [subtitle, setSubtitle] = useState(promotion?.subtitle ?? '');
  const [ctaLabel, setCtaLabel] = useState(promotion?.cta_label ?? '');
  const [imageUrl, setImageUrl] = useState(promotion?.image_url ?? '');
  const [targetType, setTargetType] = useState<PromotionTargetType>(promotion?.target_type ?? 'profile');
  const [targetId, setTargetId] = useState<number | null>(promotion?.target_id ?? null);
  const [targetValue, setTargetValue] = useState(promotion?.target_value ?? '');
  const [startsAt, setStartsAt] = useState(toDateInput(promotion?.starts_at));
  const [endsAt, setEndsAt] = useState(toDateInput(promotion?.ends_at));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const activeItems = useMemo(() => items.filter((item) => (item.status ?? 'active') === 'active'), [items]);
  const hint = TARGETS.find((option) => option.type === targetType)?.hint ?? '';

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      setImageUrl(await apiService.uploadPromotionImage(file));
    } catch (err) {
      setError((err as Error)?.message || 'Não foi possível enviar a imagem.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!imageUrl) {
      setError('Escolha a arte do banner.');
      return;
    }
    if (targetType === 'item' && !targetId) {
      setError('Escolha qual anúncio o banner vai abrir.');
      return;
    }
    if (targetType === 'category' && !targetValue) {
      setError('Escolha a categoria de destino.');
      return;
    }
    if (targetType === 'search' && targetValue.trim().length < 2) {
      setError('Escreva o termo de busca (mínimo 2 letras).');
      return;
    }

    const body: PromotionRequest = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      cta_label: ctaLabel.trim(),
      image_url: imageUrl,
      target_type: targetType,
      target_id: targetType === 'item' ? targetId : null,
      target_value: targetType === 'category' || targetType === 'search' ? targetValue.trim() : '',
      starts_at: startsAt ? new Date(`${startsAt}T00:00:00`).toISOString() : null,
      ends_at: endsAt ? new Date(`${endsAt}T23:59:00`).toISOString() : null,
    };

    setSaving(true);
    try {
      if (promotion) {
        await apiService.updatePromotion(promotion.id, body);
      } else {
        await apiService.createPromotion(body);
      }
      onSaved();
    } catch (err) {
      setError((err as Error)?.message || 'Não foi possível salvar a campanha.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? <div className={errorBannerClass} role="alert">{error}</div> : null}

      <div>
        <span className={labelClass}>Arte do banner</span>
        <div className="relative h-40 overflow-hidden rounded-card bg-subtle">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveImageUrl(imageUrl)} alt="" className="h-full w-full object-cover object-center" />
          ) : (
            <div className={cx('flex h-full items-center justify-center', metaClass)}>
              Nenhuma imagem escolhida
            </div>
          )}
        </div>
        <label className={cx(btnGhostClass, 'mt-2 w-full cursor-pointer')}>
          {uploading ? 'Enviando...' : imageUrl ? 'Trocar imagem' : 'Escolher imagem'}
          <input type="file" accept="image/*" className="sr-only" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      <div>
        <label htmlFor="promo-title" className={labelClass}>Título</label>
        <input
          id="promo-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={80}
          className={fieldClass}
          placeholder="Ex.: Semana de ofertas"
        />
      </div>

      <div>
        <label htmlFor="promo-subtitle" className={labelClass}>Subtítulo (opcional)</label>
        <input
          id="promo-subtitle"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          maxLength={160}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="promo-cta" className={labelClass}>Texto do botão (opcional)</label>
        <input
          id="promo-cta"
          value={ctaLabel}
          onChange={(e) => setCtaLabel(e.target.value)}
          maxLength={24}
          className={fieldClass}
          placeholder="Ver minha loja"
        />
      </div>

      <div>
        <span className={labelClass}>Para onde o banner leva</span>
        <div className="flex flex-wrap gap-2">
          {TARGETS.map((option) => (
            <button
              key={option.type}
              type="button"
              onClick={() => {
                setTargetType(option.type);
                setTargetId(null);
                setTargetValue('');
              }}
              className={cx(
                'min-h-9 rounded-pill border px-3.5 type-meta font-semibold transition-colors',
                targetType === option.type
                  ? 'border-ink bg-ink text-white'
                  : 'border-[color:var(--color-border)] bg-surface text-ink hover:border-ink/30'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className={`${metaClass} mt-2`}>{hint}</p>

        {targetType === 'item' ? (
          activeItems.length === 0 ? (
            <p className={`${metaClass} mt-3`}>Você ainda não tem anúncio ativo para destacar.</p>
          ) : (
            <select
              value={targetId ?? ''}
              onChange={(e) => setTargetId(Number(e.target.value) || null)}
              className={cx(fieldClass, 'mt-3')}
              aria-label="Anúncio de destino"
            >
              <option value="">Escolha o anúncio</option>
              {activeItems.map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          )
        ) : null}

        {targetType === 'category' ? (
          <select
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            className={cx(fieldClass, 'mt-3')}
            aria-label="Categoria de destino"
          >
            <option value="">Escolha a categoria</option>
            {CATEGORIES.map((category) => (
              <option key={category.slug} value={category.slug}>{category.name}</option>
            ))}
          </select>
        ) : null}

        {targetType === 'search' ? (
          <input
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            className={cx(fieldClass, 'mt-3')}
            placeholder="ex.: bicicleta aro 29"
            aria-label="Termo de busca"
          />
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="promo-starts" className={labelClass}>Começa em (opcional)</label>
          <input
            id="promo-starts"
            type="date"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="promo-ends" className={labelClass}>Termina em (opcional)</label>
          <input
            id="promo-ends"
            type="date"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving || uploading} className={btnInkClass}>
          {saving ? 'Salvando...' : promotion ? 'Salvar alterações' : 'Publicar campanha'}
        </button>
        <button type="button" onClick={onCancel} className={btnGhostClass}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
