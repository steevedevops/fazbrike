'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageShell, PageSpinner } from '@/components/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { ItemForm, ItemFormValues, ItemPhotoSlot, MAX_ITEM_IMAGES } from '@/components/ItemForm';
import { useAuth } from '@/hooks/useAuth';
import { useItems } from '@/hooks/useItems';
import { resolveImageUrl } from '@/lib/services/api';
import { ListingType, parseAttrs, parsePriceInput, stringifyAttrs } from '@/lib/catalog';
import { btnSecondaryClass, panelClass } from '@/lib/ui-classes';

type PendingPhoto = ItemPhotoSlot & { file: File };

export default function EditarPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { getItem, updateItem, uploadImages, deleteItemImage } = useItems();

  const [formData, setFormData] = useState<ItemFormValues>({
    title: '',
    description: '',
    price: '',
    category: '',
    location: '',
    state_id: '',
    city_id: '',
    condition: 'new',
    listing_type: 'item',
    listing_mode: 'sale',
  });
  const [existingPhotos, setExistingPhotos] = useState<ItemPhotoSlot[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
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
    const load = async () => {
      if (!params.id || !isAuthenticated || !user) return;
      try {
        const item = await getItem(Number(params.id));
        if (item.user_id !== user.id) {
          setError('Você não pode editar este anúncio.');
          setPageLoading(false);
          return;
        }
        const attrs = parseAttrs<Record<string, string>>(item.attrs);
        setFormData({
          title: item.title || '',
          description: item.description || '',
          price: String(item.price ?? ''),
          category: item.category || '',
          location: item.location || '',
          state_id: item.state_id ? String(item.state_id) : '',
          city_id: item.city_id ? String(item.city_id) : '',
          condition: item.condition || 'new',
          listing_type: (item.listing_type as ListingType) || 'item',
          brand: attrs.brand || '',
          model: attrs.model || '',
          year: attrs.year || '',
          mileage: attrs.mileage || '',
          transmission: attrs.transmission || '',
          property_type: attrs.property_type || '',
          bedrooms: attrs.bedrooms || '',
          bathrooms: attrs.bathrooms || '',
          area_m2: attrs.area_m2 || '',
          furnished: attrs.furnished || '',
          pets_allowed: attrs.pets_allowed || '',
          listing_mode: attrs.listing_mode || 'sale',
        });

        const gallery =
          item.images && item.images.length > 0
            ? item.images
            : item.image_url
              ? [{ id: 0, item_id: item.id, url: item.image_url, sort_order: 0 }]
              : [];
        setExistingPhotos(
          gallery.map((img, index) => ({
            key: img.id > 0 ? `existing-${img.id}` : `legacy-${index}`,
            url: resolveImageUrl(img.url),
            existingId: img.id > 0 ? img.id : undefined,
          }))
        );
      } catch (err) {
        const message =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message?: unknown }).message)
            : '';
        setError(message || 'Não foi possível carregar o anúncio.');
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [params.id, isAuthenticated, user, getItem]);

  const photos: ItemPhotoSlot[] = [...existingPhotos, ...pendingPhotos];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotosAdd = (files: FileList | null) => {
    if (!files?.length) return;
    setPendingPhotos((prev) => {
      const room = MAX_ITEM_IMAGES - existingPhotos.length - prev.length;
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
    const existing = existingPhotos.find((p) => p.key === key);
    if (existing) {
      if (existing.existingId) {
        setRemovedImageIds((prev) => [...prev, existing.existingId!]);
      }
      setExistingPhotos((prev) => prev.filter((p) => p.key !== key));
      return;
    }
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

    try {
      const id = Number(params.id);
      if (!formData.city_id) {
        setError('Selecione a cidade do anúncio.');
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
		const updatedItem = await updateItem(id, {
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

      for (const imageId of removedImageIds) {
        await deleteItemImage(id, imageId);
      }
      if (pendingPhotos.length > 0) {
        await uploadImages(
          id,
          pendingPhotos.map((p) => p.file)
        );
      }

		router.push(updatedItem.status === 'pending' ? '/perfil' : `/produto/${id}`);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : '';
      setError(message || 'Erro ao salvar anúncio. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || pageLoading) return <PageSpinner />;
  if (!isAuthenticated) return null;

  return (
    <PageShell width="form">
      <PageHeader title="Editar anúncio" subtitle="Atualize os dados e as fotos do seu item." />
      <div className={`${panelClass} p-6 sm:p-8`}>
        {error.includes('não pode editar') ? (
          <p className="type-body text-danger">{error}</p>
        ) : (
          <ItemForm
            values={formData}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            photos={photos}
            onPhotosAdd={handlePhotosAdd}
            onPhotoRemove={handlePhotoRemove}
            submitLabel="Salvar alterações"
            secondaryAction={
              <button type="button" onClick={() => router.back()} className={`${btnSecondaryClass} flex-1`}>
                Cancelar
              </button>
            }
          />
        )}
      </div>
    </PageShell>
  );
}
