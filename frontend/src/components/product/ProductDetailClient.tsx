'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { ProductCard } from '@/components/ProductCard';
import { useItems } from '@/hooks/useItems';
import { useAuth } from '@/hooks/useAuth';
import {
  Item,
  ItemComment,
  ItemReportReason,
  apiService,
  createItemComment,
  deleteItemComment,
  favoriteItem,
  fetchItemComments,
  registerItemView,
  reportItem,
  resolveImageUrl,
  unfavoriteItem,
} from '@/lib/services/api';
import {
  LISTING_TYPES,
  categoryCover,
  categoryLabel,
  conditionLabel,
  formatPrice,
  listingImageSrc,
  parentOfSlug,
  parseAttrs,
} from '@/lib/catalog';
import {
  btnDangerClass,
  btnPrimaryClass,
  btnSecondaryClass,
  containerClass,
  cx,
  fieldClass,
  labelClass,
  listingRailClass,
  listingRailItemClass,
  metaClass,
  navLinkClass,
  panelClass,
  sectionTitleClass,
} from '@/lib/ui-classes';

type Tab = 'anuncio' | 'fotos';

function SpecIcon({ name }: { name: string }) {
  const common = 'w-5 h-5 text-muted shrink-0';
  if (name === 'location') {
    return (
      <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.5" strokeWidth={1.5} />
      </svg>
    );
  }
  if (name === 'calendar') {
    return (
      <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 3v2m8-2v2M4.5 8h15M6 5.5h12A1.5 1.5 0 0119.5 7v12a1.5 1.5 0 01-1.5 1.5H6A1.5 1.5 0 014.5 19V7A1.5 1.5 0 016 5.5z" />
      </svg>
    );
  }
  if (name === 'gauge') {
    return (
      <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19a7 7 0 100-14 7 7 0 000 14zM12 12l3.5-3.5" />
      </svg>
    );
  }
  if (name === 'gear') {
    return (
      <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 6h3l.6 2.2a6.5 6.5 0 011.7 1l2.1-.7 1.5 2.6-1.5 1.5c.1.6.1 1.1 0 1.7l1.5 1.5-1.5 2.6-2.1-.7a6.5 6.5 0 01-1.7 1L13.5 18h-3l-.6-2.2a6.5 6.5 0 01-1.7-1l-2.1.7L4.6 13l1.5-1.5a6.8 6.8 0 010-1.7L4.6 8.3l1.5-2.6 2.1.7a6.5 6.5 0 011.7-1L10.5 6z" />
      </svg>
    );
  }
  return (
    <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 7.5h15v9h-15zM8 7.5V6m8 1.5V6" />
    </svg>
  );
}

interface ProductDetailClientProps {
  initialItem: Item;
}

export function ProductDetailClient({ initialItem }: ProductDetailClientProps) {
  const router = useRouter();
  const { deleteItem } = useItems();
  const { user, isAuthenticated } = useAuth();
  const [item, setItem] = useState<Item>(initialItem);
  const [related, setRelated] = useState<Item[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState<Tab>('anuncio');
  const [descExpanded, setDescExpanded] = useState(false);
  const [message, setMessage] = useState(
    `Olá, gostaria de mais informações sobre este anúncio${initialItem.title ? `: ${initialItem.title}` : ''}.`
  );
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendOk, setSendOk] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [comments, setComments] = useState<ItemComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentSending, setCommentSending] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [favoriteSaving, setFavoriteSaving] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ItemReportReason>('misleading');
  const [reportDetails, setReportDetails] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');

  useEffect(() => {
    let alive = true;
    fetchItemComments(initialItem.id)
      .then((data) => alive && setComments(data))
      .catch(() => undefined);
    const qs = initialItem.category
      ? `category=${encodeURIComponent(initialItem.category)}`
      : '';
    apiService
      .get<Item[]>(qs ? `/items?${qs}` : '/items')
      .then((list) => {
        if (!alive) return;
        setRelated((list || []).filter((x) => x.id !== initialItem.id).slice(0, 8));
      })
      .catch(() => alive && setRelated([]));
    return () => {
      alive = false;
    };
  }, [initialItem.id, initialItem.category]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    let alive = true;
    registerItemView(item.id)
      .then((response) => {
        if (!alive) return;
        setItem((current) => ({ ...current, views_count: response.views_count }));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [item.id, isAuthenticated, user?.id]);

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este anúncio?')) return;
    setDeleting(true);
    try {
      await deleteItem(item.id);
      router.push('/perfil');
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : '';
      alert(msg || 'Erro ao excluir item');
      setDeleting(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    const content = message.trim().slice(0, 150);
    if (!content) return;
    setSending(true);
    setSendError('');
    setSendOk(false);
    try {
      await apiService.sendMessage(item.id, item.user_id, content);
      setSendOk(true);
      goToConversation();
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : '';
      setSendError(msg || 'Não foi possível enviar a mensagem.');
    } finally {
      setSending(false);
    }
  };

  const goToConversation = () => {
    const params = new URLSearchParams({
      otherUserId: String(item.user_id),
      itemId: String(item.id),
      otherUserName: item.user?.name || 'Vendedor',
      itemTitle: item.title,
    });
    router.push(`/messages?${params.toString()}`);
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setFavoriteSaving(true);
    try {
      const response = item.is_favorited
        ? await unfavoriteItem(item.id)
        : await favoriteItem(item.id);
      setItem({
        ...item,
        is_favorited: response.favorited,
        favorites_count: response.favorites_count,
      });
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : '';
      alert(msg || 'Não foi possível atualizar seus favoritos.');
    } finally {
      setFavoriteSaving(false);
    }
  };

  const openReport = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setReportError('');
    setReportOpen(true);
  };

  const handleReport = async (event: React.FormEvent) => {
    event.preventDefault();
    setReporting(true);
    setReportError('');
    try {
      const response = await reportItem(item.id, reportReason, reportDetails);
      setReportSuccess(response.message);
      setReportOpen(false);
      setReportDetails('');
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : '';
      setReportError(message || 'Não foi possível enviar a denúncia.');
    } finally {
      setReporting(false);
    }
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    const content = commentText.trim();
    if (!content) {
      setCommentError('Escreva uma pergunta ou comentário.');
      return;
    }
    setCommentSending(true);
    setCommentError('');
    try {
      const created = await createItemComment(item.id, content);
      setComments((prev) => [created, ...prev]);
      setItem({ ...item, comments_count: (item.comments_count || 0) + 1 });
      setCommentText('');
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : '';
      setCommentError(msg || 'Não foi possível publicar o comentário.');
    } finally {
      setCommentSending(false);
    }
  };

  const handleDeleteComment = async (comment: ItemComment) => {
    try {
      await deleteItemComment(item.id, comment.id);
      setComments((prev) => prev.filter((current) => current.id !== comment.id));
      setItem({ ...item, comments_count: Math.max((item.comments_count || 1) - 1, 0) });
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : '';
      alert(msg || 'Não foi possível remover o comentário.');
    }
  };

  const attrs = useMemo(() => parseAttrs<Record<string, string>>(item.attrs), [item.attrs]);

  const imageUrl = (() => {
    const raw = listingImageSrc(item.image_url, item.category);
    return raw.startsWith('/categories/') ? raw : resolveImageUrl(raw);
  })();
  const gallery = (() => {
    const fromImages = (item.images || [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
      .map((img) => resolveImageUrl(img.url))
      .filter(Boolean);
    if (fromImages.length > 0) return fromImages;
    return [imageUrl];
  })();
  const isOwner = !!(user && item.user_id === user.id);
  const sellerName = item.user?.name || 'Vendedor';
  const sellerInitial = sellerName.charAt(0).toUpperCase();
  const memberSince = item.user?.created_at
    ? new Date(item.user.created_at).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      })
    : null;
  const parent = item.category ? parentOfSlug(item.category) : undefined;
  const catLabel = categoryLabel(item.category);
  const parentLabel = parent ? categoryLabel(parent.slug) : null;
  const updatedAt = new Date(item.updated_at || item.created_at).toLocaleString('pt-BR');

  const specs: Array<{ icon: string; label: string; value: string }> = [];
  if (item.location) specs.push({ icon: 'location', label: 'Cidade', value: item.location });
  if (item.condition)
    specs.push({ icon: 'tag', label: 'Condição', value: conditionLabel(item.condition) });
  if (attrs.year) specs.push({ icon: 'calendar', label: 'Ano', value: attrs.year });
  if (attrs.mileage)
    specs.push({
      icon: 'gauge',
      label: 'Quilometragem',
      value: `${Number(attrs.mileage).toLocaleString('pt-BR')} Km`,
    });
  if (attrs.transmission)
    specs.push({
      icon: 'gear',
      label: 'Câmbio',
      value:
        attrs.transmission === 'automatic'
          ? 'Automático'
          : attrs.transmission === 'manual'
            ? 'Manual'
            : attrs.transmission,
    });
  if (attrs.brand) specs.push({ icon: 'tag', label: 'Marca', value: attrs.brand });
  if (attrs.model) specs.push({ icon: 'tag', label: 'Modelo', value: attrs.model });
  if (attrs.bedrooms) specs.push({ icon: 'tag', label: 'Quartos', value: attrs.bedrooms });
  if (attrs.bathrooms) specs.push({ icon: 'tag', label: 'Banheiros', value: attrs.bathrooms });
  if (attrs.area_m2) specs.push({ icon: 'tag', label: 'Área', value: `${attrs.area_m2} m²` });
  if (attrs.listing_mode)
    specs.push({
      icon: 'tag',
      label: 'Finalidade',
      value: attrs.listing_mode === 'rent' ? 'Locação' : 'Venda',
    });
  if (item.listing_type)
    specs.push({
      icon: 'tag',
      label: 'Tipo',
      value:
        LISTING_TYPES.find((x) => x.value === item.listing_type)?.label || item.listing_type,
    });

  const desc = item.description || '';
  const descShort = desc.length > 320 && !descExpanded ? `${desc.slice(0, 320).trim()}…` : desc;

  return (
    <PageShell flush>
      <div className={`${containerClass} pt-4 pb-16`}>
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-pill border border-[color:var(--color-border)] text-muted hover:text-ink hover:bg-subtle"
            aria-label="Voltar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-5 type-meta">
            <button
              type="button"
              onClick={() => setTab('anuncio')}
              className={cx(
                'pb-2 border-b-2 lowercase',
                tab === 'anuncio'
                  ? 'text-ink border-brand-500 font-medium'
                  : 'text-muted border-transparent hover:text-ink'
              )}
            >
              anúncio
            </button>
            <button
              type="button"
              onClick={() => setTab('fotos')}
              className={cx(
                'pb-2 border-b-2 lowercase',
                tab === 'fotos'
                  ? 'text-ink border-brand-500 font-medium'
                  : 'text-muted border-transparent hover:text-ink'
              )}
            >
              fotos
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <nav className={`${metaClass} flex flex-wrap gap-1`} aria-label="Breadcrumb">
            <Link href="/" className="hover:text-ink">
              Home
            </Link>
            {parentLabel ? (
              <>
                <span>/</span>
                <Link href={`/geral?category=${parent?.slug}`} className="hover:text-ink">
                  {parentLabel}
                </Link>
              </>
            ) : null}
            {item.category ? (
              <>
                <span>/</span>
                <Link href={`/geral?category=${item.category}`} className="hover:text-ink">
                  {catLabel}
                </Link>
              </>
            ) : null}
            <span>/</span>
            <span className="text-ink">{item.title}</span>
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFavorite}
              disabled={favoriteSaving}
              className="inline-flex h-9 items-center justify-center rounded-pill border border-[color:var(--color-border)] px-3 type-meta font-medium text-muted hover:text-ink hover:bg-subtle"
              aria-label={item.is_favorited ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
            >
              <svg className="mr-1.5 h-4 w-4" fill={item.is_favorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {item.is_favorited ? 'Salvo' : 'Salvar'}
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-pill border border-[color:var(--color-border)] text-muted hover:text-ink"
              aria-label="Compartilhar"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: item.title, url: window.location.href }).catch(() => undefined);
                } else {
                  navigator.clipboard?.writeText(window.location.href);
                }
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v14" />
              </svg>
            </button>
            {!isOwner ? (
              <button
                type="button"
                onClick={openReport}
                className="inline-flex h-9 items-center justify-center rounded-pill border border-[color:var(--color-border)] px-3 type-meta font-medium text-muted hover:text-danger hover:bg-subtle"
              >
                Denunciar
              </button>
            ) : null}
          </div>
        </div>

        {(tab === 'anuncio' || tab === 'fotos') && (
          <div
            className={
              gallery.length > 1
                ? 'grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3 mb-6'
                : 'mb-6'
            }
          >
            <div className={`${panelClass} overflow-hidden bg-subtle min-h-[280px] sm:min-h-[420px]`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gallery[Math.min(activeImage, gallery.length - 1)]}
                alt={item.title}
                className="w-full h-full max-h-[520px] object-cover"
                onError={(event) => {
                  event.currentTarget.src = categoryCover(item.category);
                }}
              />
            </div>
            {gallery.length > 1 ? (
              <div className="grid grid-rows-2 gap-3">
                {gallery.slice(1, 3).map((src, i) => {
                  const idx = i + 1;
                  return (
                    <button
                      key={`${src}-${idx}`}
                      type="button"
                      onClick={() => {
                        setActiveImage(idx);
                        setTab('fotos');
                      }}
                      className={`${panelClass} overflow-hidden bg-subtle relative min-h-[130px] sm:min-h-[200px]`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(event) => {
                          event.currentTarget.src = categoryCover(item.category);
                        }}
                      />
                      {idx === 2 && gallery.length > 3 ? (
                        <span className="absolute inset-0 flex items-center justify-center bg-ink/50 type-body text-white font-medium">
                          +{gallery.length - 3} fotos
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        )}

        {tab === 'anuncio' ? (
          <div className="grid grid-cols-1 gap-6 items-start min-[960px]:grid-cols-[minmax(0,1fr)_340px]">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div className="min-w-0">
                  <p className="type-display font-bold text-ink tracking-tight">
                    {formatPrice(item.price)}
                  </p>
                  <h1 className="type-title text-ink font-medium mt-1">{item.title}</h1>
                  {item.location ? (
                    <p className={`${metaClass} mt-1`}>{item.location}</p>
                  ) : null}
                  <p className={`${metaClass} mt-1`}>
                    {item.views_count || 0} {(item.views_count || 0) === 1 ? 'visualização' : 'visualizações'}
                    {' · '}
                    {item.favorites_count || 0} {(item.favorites_count || 0) === 1 ? 'salvo' : 'salvos'}
                    {' · '}
                    {item.comments_count || 0} {(item.comments_count || 0) === 1 ? 'pergunta' : 'perguntas'}
                  </p>
                  {attrs.model || attrs.brand ? (
                    <p className={`${metaClass} mt-1`}>
                      {[attrs.brand, attrs.model].filter(Boolean).join(' ')}
                    </p>
                  ) : null}
                </div>
              </div>

              {specs.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-5 mb-8 pb-8 border-b border-[color:var(--color-border)]">
                  {specs.map((spec) => (
                    <div key={`${spec.label}-${spec.value}`} className="flex items-start gap-2.5">
                      <SpecIcon name={spec.icon} />
                      <div>
                        <p className={metaClass}>{spec.label}</p>
                        <p className="type-body text-ink font-medium">{spec.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <section className="mb-8">
                <h3 className="type-title text-ink">Descrição</h3>
                <p className={`${metaClass} mt-1`}>Última atualização: {updatedAt}</p>
                <p className="type-body text-muted mt-3 whitespace-pre-line break-words">{descShort}</p>
                {desc.length > 320 ? (
                  <button
                    type="button"
                    onClick={() => setDescExpanded((v) => !v)}
                    className="mt-2 type-meta font-medium text-brand-500 hover:text-brand-600"
                  >
                    {descExpanded ? 'Ver menos' : 'Ver descrição completa'}
                  </button>
                ) : null}
              </section>

              <section className="mb-8 border-t border-[color:var(--color-border)] pt-8">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="type-title text-ink">Perguntas públicas</h3>
                    <p className={`${metaClass} mt-1`}>
                      Pergunte sobre o produto. Todos podem ver as perguntas e comentários.
                    </p>
                  </div>
                  <span className={metaClass}>{comments.length}</span>
                </div>

                {isAuthenticated ? (
                  <form onSubmit={handleCreateComment} className="mb-5 space-y-3">
                    <textarea
                      rows={3}
                      maxLength={300}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className={fieldClass}
                      placeholder="Escreva sua pergunta..."
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className={metaClass}>{commentText.length} / 300</p>
                      <button type="submit" disabled={commentSending} className={btnPrimaryClass}>
                        {commentSending ? 'Publicando...' : 'Publicar pergunta'}
                      </button>
                    </div>
                    {commentError ? <p className="type-meta text-danger">{commentError}</p> : null}
                  </form>
                ) : (
                  <div className={`${panelClass} mb-5 p-4`}>
                    <p className={metaClass}>
                      <Link href="/login" className="underline">
                        Entre
                      </Link>{' '}
                      para fazer uma pergunta pública sobre este produto.
                    </p>
                  </div>
                )}

                {comments.length === 0 ? (
                  <p className={metaClass}>Ainda não há perguntas neste anúncio.</p>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => {
                      const canDelete =
                        !!user &&
                        (comment.user_id === user.id || item.user_id === user.id || user.role === 'admin');
                      return (
                        <article key={comment.id} className={`${panelClass} p-4`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="type-meta font-medium text-ink">
                                {comment.user?.name || 'Usuário'}
                              </p>
                              <p className={metaClass}>
                                {new Date(comment.created_at).toLocaleString('pt-BR')}
                              </p>
                            </div>
                            {canDelete ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(comment)}
                                className="type-meta text-muted hover:text-danger"
                              >
                                Remover
                              </button>
                            ) : null}
                          </div>
                          <p className="type-body mt-3 whitespace-pre-line break-words text-ink/80">
                            {comment.content}
                          </p>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              {isOwner ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href={`/editar/${item.id}`} className={`${btnPrimaryClass} flex-1`}>
                    Editar anúncio
                  </Link>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className={`${btnDangerClass} flex-1`}
                  >
                    {deleting ? 'Excluindo...' : 'Excluir anúncio'}
                  </button>
                </div>
              ) : null}
            </div>

            <aside className="space-y-4 min-[960px]:sticky min-[960px]:top-[84px] min-[960px]:max-h-[calc(100vh-100px)] min-[960px]:self-start min-[960px]:overflow-y-auto min-[960px]:overscroll-contain min-[960px]:pr-1 min-[960px]:[scrollbar-width:thin]">
              <div className={`${panelClass} p-5`}>
                <h2 className={sectionTitleClass}>Fale com o anunciante</h2>
                {isOwner ? (
                  <p className={`${metaClass} mt-3`}>Este anúncio é seu.</p>
                ) : (
                  <form onSubmit={handleSend} className="mt-4 space-y-4">
                    {user ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="type-meta font-medium text-ink">Meus dados</p>
                          <Link href="/perfil" className="type-meta text-brand-500 hover:text-brand-600">
                            Editar dados
                          </Link>
                        </div>
                        <p className={metaClass}>{user.name}</p>
                        <p className={metaClass}>{user.email}</p>
                      </div>
                    ) : (
                      <p className={metaClass}>
                        <Link href="/login" className="underline">
                          Entre
                        </Link>{' '}
                        para enviar mensagem ao vendedor.
                      </p>
                    )}

                    <div>
                      <label htmlFor="msg-anuncio" className={labelClass}>
                        Escrever mensagem
                      </label>
                      <textarea
                        id="msg-anuncio"
                        rows={4}
                        maxLength={150}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className={fieldClass}
                      />
                      <p className={`${metaClass} text-right mt-1`}>
                        {message.length} / 150
                      </p>
                    </div>

                    {sendError ? <p className="type-meta text-danger">{sendError}</p> : null}
                    {sendOk ? <p className="type-meta text-success">Mensagem enviada.</p> : null}

                    <button type="submit" disabled={sending} className={`${btnPrimaryClass} w-full`}>
                      {sending ? 'Enviando...' : 'Enviar mensagem'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isAuthenticated) {
                          router.push('/login');
                          return;
                        }
                        goToConversation();
                      }}
                      className={`${btnSecondaryClass} w-full`}
                    >
                      Abrir conversa
                    </button>
                  </form>
                )}
              </div>

              <div className={`${panelClass} p-5`}>
                <p className={metaClass}>Anunciante</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-pill bg-subtle flex items-center justify-center type-title text-ink">
                    {sellerInitial}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/usuario/${item.user_id}`}
                      className="type-title text-ink hover:underline"
                    >
                      {sellerName}
                    </Link>
                    <p className={metaClass}>
                      {memberSince ? `Desde ${memberSince} no Fazbrike` : 'Vendedor no Fazbrike'}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/usuario/${item.user_id}`}
                  className="mt-4 inline-block type-meta text-brand-500 hover:text-brand-600 underline"
                >
                  Ver anúncios do vendedor
                </Link>
              </div>
            </aside>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
            {gallery.map((src, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImage(idx)}
                className={`${panelClass} overflow-hidden aspect-[4/3] ${
                  activeImage === idx ? 'ring-2 ring-brand-500' : ''
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {related.length > 0 ? (
          <section className="mt-10 pt-8 border-t border-[color:var(--color-border)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className={sectionTitleClass}>Anúncios que você pode gostar</h2>
              <Link href={item.category ? `/geral?category=${item.category}` : '/geral'} className={navLinkClass}>
                Ver mais
              </Link>
            </div>
            <div className={listingRailClass}>
              {related.map((rel) => (
                <div key={rel.id} className={listingRailItemClass}>
                  <ProductCard
                    id={rel.id}
                    price={rel.price}
                    name={rel.title}
                    imageUrl={rel.image_url}
                    category={rel.category}
                    location={rel.location}
                    condition={rel.condition}
                    viewsCount={rel.views_count || 0}
                    favoritesCount={rel.favorites_count || 0}
                    isFavorited={!!rel.is_favorited}
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {reportOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !reporting) setReportOpen(false);
          }}
        >
          <div className={`${panelClass} w-full max-w-lg bg-surface p-6`} role="dialog" aria-modal="true" aria-labelledby="report-title">
            <h2 id="report-title" className={sectionTitleClass}>Denunciar anúncio</h2>
            <p className={`${metaClass} mt-2`}>
              Conte o que há de errado. A denúncia será analisada pela equipe do Fazbrike.
            </p>
            <form onSubmit={handleReport} className="mt-5 space-y-4">
              <div>
                <label htmlFor="report-reason" className={labelClass}>Motivo</label>
                <select
                  id="report-reason"
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value as ItemReportReason)}
                  className={fieldClass}
                >
                  <option value="prohibited_item">Produto proibido ou ilegal</option>
                  <option value="fraud">Suspeita de fraude</option>
                  <option value="misleading">Informações enganosas</option>
                  <option value="duplicate">Anúncio duplicado</option>
                  <option value="offensive">Conteúdo ofensivo</option>
                  <option value="other">Outro motivo</option>
                </select>
              </div>
              <div>
                <label htmlFor="report-details" className={labelClass}>Detalhes (opcional)</label>
                <textarea
                  id="report-details"
                  rows={4}
                  maxLength={1000}
                  required={reportReason === 'other'}
                  value={reportDetails}
                  onChange={(event) => setReportDetails(event.target.value)}
                  className={fieldClass}
                  placeholder="Descreva o problema para ajudar na análise"
                />
                <p className={`${metaClass} mt-1 text-right`}>{reportDetails.length} / 1000</p>
              </div>
              {reportError ? <p className="type-meta text-danger" role="alert">{reportError}</p> : null}
              <div className="flex justify-end gap-3">
                <button type="button" className={btnSecondaryClass} disabled={reporting} onClick={() => setReportOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className={btnDangerClass} disabled={reporting}>
                  {reporting ? 'Enviando...' : 'Enviar denúncia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {reportSuccess ? (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-control bg-ink px-4 py-3 type-meta text-white shadow-pop" role="status">
          {reportSuccess}
          <button type="button" className="ml-3 underline" onClick={() => setReportSuccess('')}>Fechar</button>
        </div>
      ) : null}
    </PageShell>
  );
}
