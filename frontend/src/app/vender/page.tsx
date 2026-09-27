'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell, PageSpinner } from '@/components/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { ItemForm, ItemFormValues, ItemPhotoSlot, MAX_ITEM_IMAGES } from '@/components/ItemForm';
import { CategoryIcon } from '@/components/CategoryIcon';
import { useAuth } from '@/hooks/useAuth';
import { useItems } from '@/hooks/useItems';
import {
  CATEGORIES,
  LISTING_TYPES,
  ListingType,
  categoriesForListingType,
  categoryIconSlug,
  parsePriceInput,
  stringifyAttrs,
} from '@/lib/catalog';
import { fetchCategories } from '@/lib/services/api';
import {
  btnPrimaryClass,
  btnSecondaryClass,
  cx,
  metaClass,
  panelClass,
} from '@/lib/ui-classes';

type Step = 1 | 2 | 3;

type PendingPhoto = ItemPhotoSlot & { file: File };

export default function VenderPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { createItem, uploadImages } = useItems();

  const [step, setStep] = useState<Step>(1);
  const [categories, setCategories] = useState(CATEGORIES);
  const [formData, setFormData] = useState<ItemFormValues>({
    title: '',
    description: '',
    price: '',
    category: '',
    location: '',
    state_id: '',
    city_id: '',
    condition: 'new',
    listing_type: '',
    listing_mode: 'sale',
  });
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      pendingPhotos.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revoke only on unmount
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    let cancelled = false;
    if (!isAuthenticated) return;
    (async () => {
      try {
        const { fetchMyProfile } = await import('@/lib/services/api');
        const me = await fetchMyProfile();
        if (cancelled) return;
        const stateId = me.profile?.state_id ? String(me.profile.state_id) : '';
        const cityId = me.profile?.city_id ? String(me.profile.city_id) : '';
        if (stateId || cityId) {
          setFormData((prev) => ({
            ...prev,
            state_id: prev.state_id || stateId,
            city_id: prev.city_id || cityId,
            location: prev.location || me.profile?.city || '',
          }));
        }
      } catch {
        /* optional prefills */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    let cancelled = false;
    fetchCategories()
      .then((data) => {
        if (cancelled || !Array.isArray(data) || data.length === 0) return;
        setCategories(
          data.map((c) => ({
            slug: c.slug,
            name: c.name,
            listing_type: c.listing_type,
            icon: c.icon || categoryIconSlug(c.slug),
            children: (c.children || []).map((ch) => ({
              slug: ch.slug,
              name: ch.name,
              listing_type: ch.listing_type,
              icon: ch.icon,
            })),
          }))
        );
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const typedCategories = useMemo(
    () => categoriesForListingType((formData.listing_type || '') as ListingType, categories),
    [formData.listing_type, categories]
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'listing_type') {
        next.category = '';
        if (value === 'property') next.condition = 'used_good';
        if (value === 'gratis' as string) next.price = '0';
      }
      if (name === 'category' && value === 'gratis') {
        next.price = '0';
      }
      return next;
    });
  };

  const handlePhotosAdd = (files: FileList | null) => {
    if (!files?.length) return;
    setPendingPhotos((prev) => {
      const room = MAX_ITEM_IMAGES - prev.length;
      if (room <= 0) return prev;
      const next: PendingPhoto[] = [...prev];
      Array.from(files)
        .slice(0, room)
        .forEach((file) => {
          next.push({
            key: `local-${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
            url: URL.createObjectURL(file),
            file,
          });
        });
      return next;
    });
  };

  const handlePhotoRemove = (key: string) => {
    setPendingPhotos((prev) => {
      const target = prev.find((p) => p.key === key);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.key !== key);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const price = parsePriceInput(formData.price);
    if (price === null) {
      setError('Informe um preço válido (use ponto ou vírgula).');
      setLoading(false);
      return;
    }

    const listingType = (formData.listing_type || 'item') as ListingType;
    const attrs =
      listingType === 'vehicle'
        ? stringifyAttrs({
            brand: formData.brand,
            model: formData.model,
            year: formData.year,
            mileage: formData.mileage,
            transmission: formData.transmission,
          })
        : listingType === 'property'
          ? stringifyAttrs({
              property_type: formData.property_type,
              bedrooms: formData.bedrooms,
              bathrooms: formData.bathrooms,
              area_m2: formData.area_m2,
              furnished: formData.furnished,
              pets_allowed: formData.pets_allowed,
              listing_mode: formData.listing_mode,
            })
          : '{}';

    try {
      if (!formData.city_id) {
        setError('Selecione a cidade do anúncio.');
        setLoading(false);
        return;
      }
      const newItem = await createItem({
        title: formData.title.trim(),
        description: formData.description.trim(),
        price,
        category: formData.category,
        listing_type: listingType,
        location: formData.location.trim(),
        city_id: Number(formData.city_id),
        condition: formData.condition,
        attrs,
      });

      if (pendingPhotos.length > 0 && newItem.id) {
        await uploadImages(
          newItem.id,
          pendingPhotos.map((p) => p.file)
        );
      }

      router.push(newItem.status === 'pending' ? '/perfil' : `/produto/${newItem.id}`);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : '';
      setError(message || 'Erro ao criar anúncio. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <PageSpinner />;
  if (!isAuthenticated) return null;

  return (
    <PageShell width="form">
      <PageHeader
        title="Criar anúncio"
        subtitle="Escolha o tipo, a categoria e os detalhes do que você quer vender."
      />

      <div className="mb-4 flex items-center gap-2 type-meta text-muted">
        <span className={cx(step === 1 && 'text-ink font-medium')}>1. Tipo</span>
        <span aria-hidden>·</span>
        <span className={cx(step === 2 && 'text-ink font-medium')}>2. Categoria</span>
        <span aria-hidden>·</span>
        <span className={cx(step === 3 && 'text-ink font-medium')}>3. Detalhes</span>
      </div>

      {step === 1 ? (
        <div className={`${panelClass} p-6 sm:p-8 space-y-3`}>
          <p className={metaClass}>O que você quer anunciar?</p>
          {LISTING_TYPES.map((t) => {
            const selected = formData.listing_type === t.value;
            return (
              <button
                key={t.value}
                type="button"
                aria-pressed={selected}
                className={cx(
                  'w-full rounded-control border px-4 py-4 text-left text-ink transition-colors',
                  selected
                    ? 'border-ink bg-subtle ring-1 ring-ink'
                    : 'border-[color:var(--color-border)] hover:bg-subtle'
                )}
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    listing_type: t.value,
                    category: '',
                    condition: t.value === 'property' ? 'used_good' : prev.condition || 'new',
                    listing_mode:
                      t.value === 'property'
                        ? prev.listing_mode || 'sale'
                        : prev.listing_mode,
                  }));
                }}
              >
                <span className="type-title block text-ink">{t.label}</span>
                <span className="type-meta text-muted">{t.hint}</span>
              </button>
            );
          })}
          <div className="pt-4 flex justify-end">
            <button
              type="button"
              className={btnPrimaryClass}
              disabled={!formData.listing_type}
              onClick={() => setStep(2)}
            >
              Continuar
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className={`${panelClass} p-6 sm:p-8 space-y-4`}>
          <p className={metaClass}>Escolha a categoria</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {typedCategories.map((cat) => {
              const selected =
                formData.category === cat.slug ||
                !!cat.children?.some((c) => c.slug === formData.category);
              return (
                <button
                  key={cat.slug}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setFormData((prev) => ({ ...prev, category: cat.slug }))}
                  className={cx(
                    'flex items-center gap-2 rounded-control border px-3 py-3 text-left text-ink transition-colors',
                    selected
                      ? 'border-ink bg-subtle ring-1 ring-ink'
                      : 'border-[color:var(--color-border)] hover:bg-subtle'
                  )}
                >
                  <CategoryIcon slug={cat.icon || cat.slug} className="h-4 w-4" />
                  <span className="type-meta text-ink">{cat.name}</span>
                </button>
              );
            })}
          </div>

          {typedCategories
            .filter(
              (cat) =>
                cat.children?.length &&
                (formData.category === cat.slug ||
                  cat.children.some((c) => c.slug === formData.category))
            )
            .map((cat) => (
              <div key={`sub-${cat.slug}`} className="space-y-2">
                <p className={metaClass}>Subcategoria de {cat.name}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-pressed={formData.category === cat.slug}
                    className={cx(
                      'rounded-control border px-3 py-2 type-meta text-ink transition-colors',
                      formData.category === cat.slug
                        ? 'border-ink bg-subtle ring-1 ring-ink'
                        : 'border-[color:var(--color-border)] hover:bg-subtle'
                    )}
                    onClick={() => setFormData((prev) => ({ ...prev, category: cat.slug }))}
                  >
                    Todas
                  </button>
                  {cat.children!.map((child) => (
                    <button
                      key={child.slug}
                      type="button"
                      aria-pressed={formData.category === child.slug}
                      className={cx(
                        'rounded-control border px-3 py-2 type-meta text-ink transition-colors',
                        formData.category === child.slug
                          ? 'border-ink bg-subtle ring-1 ring-ink'
                          : 'border-[color:var(--color-border)] hover:bg-subtle'
                      )}
                      onClick={() => setFormData((prev) => ({ ...prev, category: child.slug }))}
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}

          <div className="pt-2 flex justify-between gap-3">
            <button type="button" className={btnSecondaryClass} onClick={() => setStep(1)}>
              Voltar
            </button>
            <button
              type="button"
              className={btnPrimaryClass}
              disabled={!formData.category}
              onClick={() => setStep(3)}
            >
              Continuar
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className={`${panelClass} p-6 sm:p-8`}>
          <ItemForm
            values={formData}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            photos={pendingPhotos}
            onPhotosAdd={handlePhotosAdd}
            onPhotoRemove={handlePhotoRemove}
            submitLabel="Publicar anúncio"
            categories={categories}
            hideCategory
            hideListingType
            secondaryAction={
              <button type="button" className={btnSecondaryClass} onClick={() => setStep(2)}>
                Voltar
              </button>
            }
          />
        </div>
      ) : null}
    </PageShell>
  );
}
