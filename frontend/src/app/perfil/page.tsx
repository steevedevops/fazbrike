'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageShell, PageSpinner } from '@/components/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { ListingSkeleton } from '@/components/layout/ListingSkeleton';
import { ProductCard } from '@/components/ProductCard';
import { MarkSoldModal, MarkSoldResult } from '@/components/MarkSoldModal';
import { useAuth } from '@/hooks/useAuth';
import { useItems } from '@/hooks/useItems';
import {
  Item,
  MyProfileResponse,
  StateOption,
  CityOption,
  resolveImageUrl,
  fetchMyProfile,
  updateMyProfile,
  uploadAvatar,
  uploadBanner,
  fetchStates,
  fetchCities,
  updateItemStatus,
  duplicateItem,
  requestBoost,
} from '@/lib/services/api';
import {
  btnPrimaryClass,
  btnSecondaryClass,
  errorBannerClass,
  fieldClass,
  labelClass,
  listingGridClass,
  metaClass,
  panelClass,
} from '@/lib/ui-classes';

export default function PerfilPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth();
  const { getUserItems, loading: itemsLoading, error } = useItems();
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [profileData, setProfileData] = useState<MyProfileResponse | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [states, setStates] = useState<StateOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [form, setForm] = useState({
    name: '',
    bio: '',
    phone: '',
    city: '',
    state: '',
    city_id: '' as string,
    state_id: '' as string,
    website: '',
    is_public: true,
  });
  const [soldModalItem, setSoldModalItem] = useState<Item | null>(null);
  const [listingMessage, setListingMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated) return;
      try {
        const [items, me, st] = await Promise.all([getUserItems(), fetchMyProfile(), fetchStates()]);
        setMyItems(items || []);
        setProfileData(me);
        setStates(st || []);
        const stateId = me.profile?.state_id ? String(me.profile.state_id) : '';
        const cityId = me.profile?.city_id ? String(me.profile.city_id) : '';
        setForm({
          name: me.user?.name || '',
          bio: me.profile?.bio || '',
          phone: me.profile?.phone || '',
          city: me.profile?.city || '',
          state: me.profile?.state || '',
          city_id: cityId,
          state_id: stateId,
          website: me.profile?.website || '',
          is_public: me.profile?.is_public !== false,
        });
        if (stateId) {
          setCities((await fetchCities(Number(stateId))) || []);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    const loadCities = async () => {
      if (!form.state_id) {
        setCities([]);
        return;
      }
      try {
        setCities((await fetchCities(Number(form.state_id))) || []);
      } catch {
        setCities([]);
      }
    };
    loadCities();
  }, [form.state_id]);

  if (authLoading) return <PageSpinner />;
  if (!isAuthenticated || !user) return null;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    const { name, value } = target;
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: target.checked }));
      return;
    }
    if (name === 'state_id') {
      setForm((prev) => ({ ...prev, state_id: value, city_id: '' }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const me = await updateMyProfile({
        name: form.name.trim(),
        bio: form.bio.trim(),
        phone: form.phone.trim(),
        website: form.website.trim(),
        is_public: form.is_public,
        city_id: form.city_id ? Number(form.city_id) : null,
        state_id: form.state_id ? Number(form.state_id) : null,
      });
      setProfileData(me);
      setEditing(false);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : '';
      setFormError(message || 'Não foi possível salvar o perfil.');
    } finally {
      setSaving(false);
    }
  };

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setSaving(true);
    setFormError('');
    try {
      const res = await uploadAvatar(e.target.files[0]);
      setProfileData((prev) =>
        prev
          ? { ...prev, profile: { ...prev.profile, ...res.profile, avatar_url: res.avatar_url } }
          : prev
      );
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : '';
      setFormError(message || 'Falha no upload do avatar.');
    } finally {
      setSaving(false);
    }
  };

  const onBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setSaving(true);
    setFormError('');
    try {
      const res = await uploadBanner(e.target.files[0]);
      setProfileData((prev) =>
        prev
          ? { ...prev, profile: { ...prev.profile, ...res.profile, banner_url: res.banner_url } }
          : prev
      );
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : '';
      setFormError(message || 'Falha no upload da capa.');
    } finally {
      setSaving(false);
    }
  };

  const confirmSold = async (result: MarkSoldResult) => {
    if (!soldModalItem) return;
    const status = result.channel === 'not_sold' ? 'inactive' : 'sold';
    try {
      const updated = await updateItemStatus(soldModalItem.id, status, {
        channel: result.channel,
        final_price: result.finalPrice,
        comment: result.comment,
      });
      setMyItems((prev) => prev.map((it) => (it.id === soldModalItem.id ? { ...it, ...updated } : it)));
      setSoldModalItem(null);
    } catch (err) {
      console.error(err);
      setListingMessage('Não foi possível salvar. Tente novamente.');
    }
  };

  const toggleActive = async (item: Item) => {
    const nextStatus = item.status === 'inactive' ? 'active' : 'inactive';
    try {
      const updated = await updateItemStatus(item.id, nextStatus);
      setMyItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, ...updated } : it)));
    } catch (err) {
      console.error(err);
      setListingMessage('Não foi possível atualizar o anúncio.');
    }
  };

  const duplicateListing = async (itemId: number) => {
    try {
      const created = await duplicateItem(itemId);
      setMyItems((prev) => [created, ...prev]);
      setListingMessage('Anúncio duplicado com sucesso.');
    } catch (err) {
      console.error(err);
      setListingMessage('Não foi possível duplicar o anúncio.');
    }
  };

  const boostListing = async (itemId: number) => {
    try {
      await requestBoost(itemId);
      setListingMessage('Solicitação de impulsionamento enviada. Nosso time vai analisar em breve.');
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : '';
      setListingMessage(message || 'Não foi possível solicitar o impulsionamento.');
    }
  };

  const displayName = profileData?.user?.name || user.name;
  const avatar = profileData?.profile?.avatar_url;
  const banner = profileData?.profile?.banner_url;
  const locationBits = [profileData?.profile?.city, profileData?.profile?.state].filter(Boolean);

  return (
    <PageShell>
      <PageHeader
        title={displayName}
        subtitle={user.email}
        action={
          <>
            <Link href="/vender" className={btnPrimaryClass}>
              Vender item
            </Link>
            <button type="button" onClick={handleLogout} className={btnSecondaryClass}>
              Sair
            </button>
          </>
        }
      />

      <div className={`${panelClass} overflow-hidden mb-8`}>
        <div className="h-28 bg-subtle relative">
          {banner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveImageUrl(banner)} alt="" className="w-full h-full object-contain" />
          ) : null}
          <label className={`${btnSecondaryClass} absolute right-3 bottom-3 cursor-pointer text-xs`}>
            Capa
            <input type="file" accept="image/*" className="sr-only" onChange={onBanner} />
          </label>
        </div>
        <div className="p-5 flex flex-col sm:flex-row gap-5 sm:items-start">
          <div className="shrink-0 -mt-12 sm:-mt-14">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-subtle border-4 border-canvas flex items-center justify-center type-title text-ink">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveImageUrl(avatar)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <label className={`${btnSecondaryClass} mt-3 inline-flex cursor-pointer`}>
              Foto
              <input type="file" accept="image/*" className="sr-only" onChange={onAvatar} />
            </label>
          </div>

          <div className="flex-1 min-w-0 sm:pt-2">
            {!editing ? (
              <>
                <div className="flex flex-wrap gap-x-8 gap-y-2">
                  <p className={metaClass}>
                    Membro desde{' '}
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  <p className={metaClass}>
                    {profileData?.listings_count ?? myItems.length} anúncio(s)
                  </p>
                  {locationBits.length ? (
                    <p className={metaClass}>{locationBits.join(', ')}</p>
                  ) : null}
                  <p className={metaClass}>
                    {profileData?.profile?.is_public === false ? 'Perfil privado' : 'Perfil público'}
                  </p>
                </div>
                {profileData?.profile?.bio ? (
                  <p className="type-body text-muted mt-3 whitespace-pre-line">
                    {profileData.profile.bio}
                  </p>
                ) : (
                  <p className={`${metaClass} mt-3`}>Complete seu perfil para compradores te conhecerem melhor.</p>
                )}
                {profileData?.profile?.phone ? (
                  <p className={`${metaClass} mt-2`}>Telefone: {profileData.profile.phone}</p>
                ) : null}
                {profileData?.profile?.website ? (
                  <p className={`${metaClass} mt-1`}>Site: {profileData.profile.website}</p>
                ) : null}
                <button
                  type="button"
                  className={`${btnSecondaryClass} mt-4`}
                  onClick={() => setEditing(true)}
                >
                  Editar perfil
                </button>
                <Link href={`/usuario/${user.id}`} className={`${btnSecondaryClass} mt-4 ml-2 inline-flex`}>
                  Ver como público
                </Link>
              </>
            ) : (
              <form onSubmit={onSave} className="space-y-4 max-w-xl">
                {formError ? (
                  <div className={errorBannerClass} role="alert">
                    {formError}
                  </div>
                ) : null}
                <div>
                  <label htmlFor="name" className={labelClass}>Nome</label>
                  <input id="name" name="name" required value={form.name} onChange={onChange} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="bio" className={labelClass}>Bio</label>
                  <textarea id="bio" name="bio" rows={3} value={form.bio} onChange={onChange} className={fieldClass} placeholder="Conte um pouco sobre você" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className={labelClass}>Telefone</label>
                    <input id="phone" name="phone" value={form.phone} onChange={onChange} className={fieldClass} placeholder="(11) 99999-9999" />
                  </div>
                  <div>
                    <label htmlFor="website" className={labelClass}>Site</label>
                    <input id="website" name="website" value={form.website} onChange={onChange} className={fieldClass} placeholder="https://" />
                  </div>
                  <div>
                    <label htmlFor="state_id" className={labelClass}>Estado</label>
                    <select id="state_id" name="state_id" value={form.state_id} onChange={onChange} className={fieldClass}>
                      <option value="">Selecione</option>
                      {states.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="city_id" className={labelClass}>Cidade</label>
                    <select
                      id="city_id"
                      name="city_id"
                      value={form.city_id}
                      onChange={onChange}
                      className={fieldClass}
                      disabled={!form.state_id}
                    >
                      <option value="">Selecione</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-2 type-meta text-ink">
                  <input
                    type="checkbox"
                    name="is_public"
                    checked={form.is_public}
                    onChange={onChange}
                  />
                  Perfil público (visível para outros usuários)
                </label>
                <div className="flex gap-3">
                  <button type="button" className={btnSecondaryClass} onClick={() => setEditing(false)}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className={btnPrimaryClass}>
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <SectionHeader title="Meus anúncios" subtitle={`${myItems.length} anúncio(s)`} />

      {listingMessage ? (
        <div className={`${panelClass} mb-4 p-3 type-meta text-ink`} role="status">
          {listingMessage}
        </div>
      ) : null}

      {error ? (
        <EmptyState title="Não foi possível carregar seus anúncios" description={error} />
      ) : itemsLoading ? (
        <ListingSkeleton count={4} />
      ) : myItems.length === 0 ? (
        <EmptyState
          title="Você ainda não publicou nenhum anúncio"
          description="Publique o primeiro item e ele aparece aqui."
          action={
            <Link href="/vender" className={btnPrimaryClass}>
              Publicar meu primeiro item
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className={listingGridClass}>
            {myItems.map((item) => (
              <div key={item.id} className="relative">
                <ProductCard
                  id={item.id}
                  price={item.price}
                  name={item.title}
                  imageUrl={item.image_url}
                  category={item.category}
                  location={item.location}
                  condition={item.condition}
                  viewsCount={item.views_count || 0}
                  favoritesCount={item.favorites_count || 0}
                  isFavorited={!!item.is_favorited}
                  href={item.status === 'active' ? `/produto/${item.id}` : `/editar/${item.id}`}
                  showFavorite={false}
                />
                <div className="mt-2 flex flex-wrap gap-2 items-center">
                  {item.status === 'pending' ? (
                    <>
                      <span className={`${metaClass} self-center`}>Aguardando análise</span>
                      <Link href={`/editar/${item.id}`} className={`${btnSecondaryClass} text-xs`}>
                        Editar anúncio
                      </Link>
                    </>
                  ) : item.status === 'rejected' ? (
                    <div className="w-full rounded-control border border-danger/20 bg-danger/5 p-3">
                      <p className="type-meta font-medium text-danger">Anúncio rejeitado</p>
                      {item.rejection_reason ? (
                        <p className={`${metaClass} mt-1`}>{item.rejection_reason}</p>
                      ) : null}
                      <Link href={`/editar/${item.id}`} className={`${btnSecondaryClass} mt-3 text-xs`}>
                        Corrigir e reenviar
                      </Link>
                    </div>
                  ) : item.status === 'sold' ? (
                    <span className={`${metaClass} self-center`}>Vendido</span>
                  ) : item.status === 'inactive' ? (
                    <>
                      <span className={`${metaClass} self-center`}>Pausado</span>
                      <button
                        type="button"
                        className={`${btnSecondaryClass} text-xs`}
                        onClick={() => toggleActive(item)}
                      >
                        Reativar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={`${btnSecondaryClass} text-xs`}
                        onClick={() => setSoldModalItem(item)}
                      >
                        Marcar vendido
                      </button>
                      <button
                        type="button"
                        className={`${btnSecondaryClass} text-xs`}
                        onClick={() => toggleActive(item)}
                      >
                        Pausar
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className={`${btnSecondaryClass} text-xs`}
                    onClick={() => duplicateListing(item.id)}
                  >
                    Duplicar
                  </button>
                  {item.status === 'active' ? (
                    <button
                      type="button"
                      className={`${btnSecondaryClass} text-xs`}
                      onClick={() => boostListing(item.id)}
                    >
                      Impulsionar
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {soldModalItem ? (
        <MarkSoldModal
          itemTitle={soldModalItem.title}
          onCancel={() => setSoldModalItem(null)}
          onConfirm={confirmSold}
        />
      ) : null}
    </PageShell>
  );
}
