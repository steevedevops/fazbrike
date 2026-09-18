'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageShell, PageSpinner } from '@/components/PageShell';
import { EmptyState } from '@/components/layout/EmptyState';
import { ListingSkeleton } from '@/components/layout/ListingSkeleton';
import { ProductCard } from '@/components/ProductCard';
import { useAuth } from '@/hooks/useAuth';
import {
  Item,
  PublicUserProfile,
  FollowUser,
  Review,
  fetchPublicProfile,
  fetchUserListings,
  fetchUserReviews,
  fetchUserFavorites,
  fetchFollowers,
  fetchFollowing,
  followUser,
  unfollowUser,
  createReview,
  updateReview,
  deleteReview,
  resolveImageUrl,
} from '@/lib/services/api';
import {
  btnDangerClass,
  btnPrimaryClass,
  btnSecondaryClass,
  errorBannerClass,
  fieldClass,
  labelClass,
  listingGridClass,
  metaClass,
} from '@/lib/ui-classes';

type ShopTab = 'for_sale' | 'sold' | 'favorites' | 'followers' | 'following' | 'reviews';

function Stars({ average, count }: { average: number; count?: number }) {
  const full = Math.round(average || 0);
  return (
    <span className="inline-flex items-center gap-1 text-sm text-ink" aria-label={`${average.toFixed(1)} de 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < full ? 'text-ink' : 'text-subtle'}>
          ★
        </span>
      ))}
      {typeof count === 'number' ? <span className={metaClass}>({count})</span> : null}
    </span>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1).replace('.', ',')} mil`;
  }
  return String(n);
}

const RATING_LABELS: Record<number, string> = {
  1: 'Muito ruim',
  2: 'Ruim',
  3: 'Regular',
  4: 'Boa',
  5: 'Excelente',
};

function StarPicker({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={disabled}
          onClick={() => onChange(s)}
          className={`text-2xl leading-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 rounded-sm ${
            s <= value ? 'text-ink' : 'text-subtle hover:text-neutral-300'
          }`}
          aria-label={`Nota ${s} de 5`}
        >
          ★
        </button>
      ))}
      {value > 0 ? <span className={`${metaClass} ml-1`}>{RATING_LABELS[value]}</span> : null}
    </div>
  );
}

export default function UsuarioPublicoPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { user, isAuthenticated } = useAuth();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [tab, setTab] = useState<ShopTab>('for_sale');
  const [items, setItems] = useState<Item[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [people, setPeople] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState('');
  const [shopQuery, setShopQuery] = useState('');
  const [followBusy, setFollowBusy] = useState(false);

  const isOwner = Boolean(user && profile && user.id === profile.id);

  const loadProfile = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const p = await fetchPublicProfile(id);
      setProfile(p);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : '';
      setError(message || 'Não foi possível carregar este perfil.');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadTab = useCallback(async () => {
    if (!id || !profile) return;
    setTabLoading(true);
    try {
      if (tab === 'for_sale' || tab === 'sold') {
        const list = await fetchUserListings(id, {
          status: tab === 'for_sale' ? 'active' : 'sold',
          q: tab === 'for_sale' ? shopQuery.trim() || undefined : undefined,
        });
        setItems(list || []);
        setPeople([]);
        setReviews([]);
      } else if (tab === 'favorites') {
        setItems((await fetchUserFavorites(id)) || []);
        setPeople([]);
        setReviews([]);
      } else if (tab === 'followers') {
        setPeople((await fetchFollowers(id)) || []);
        setItems([]);
        setReviews([]);
      } else if (tab === 'following') {
        setPeople((await fetchFollowing(id)) || []);
        setItems([]);
        setReviews([]);
      } else if (tab === 'reviews') {
        setReviews((await fetchUserReviews(id)) || []);
        setItems([]);
        setPeople([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTabLoading(false);
    }
  }, [id, profile, tab, shopQuery]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    loadTab();
  }, [loadTab]);

  const tabs = useMemo(() => {
    if (!profile) return [];
    return [
      { id: 'for_sale' as const, label: `${formatCount(profile.for_sale_count)} à venda` },
      { id: 'sold' as const, label: `${formatCount(profile.sold_count)} vendidos` },
      { id: 'favorites' as const, label: `${formatCount(profile.favorites_count)} favoritos` },
      { id: 'followers' as const, label: `${formatCount(profile.followers_count)} seguidores` },
      { id: 'following' as const, label: `${formatCount(profile.following_count)} seguindo` },
      { id: 'reviews' as const, label: `avaliações (${profile.rating_count})` },
    ];
  }, [profile]);

  const onFollow = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!profile || isOwner) return;
    setFollowBusy(true);
    try {
      if (profile.is_following) {
        await unfollowUser(profile.id);
        setProfile({
          ...profile,
          is_following: false,
          followers_count: Math.max(0, profile.followers_count - 1),
        });
      } else {
        await followUser(profile.id);
        setProfile({
          ...profile,
          is_following: true,
          followers_count: profile.followers_count + 1,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFollowBusy(false);
    }
  };

  const onChat = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!profile) return;
    const params = new URLSearchParams({
      otherUserId: String(profile.id),
      otherUserName: profile.name,
      itemTitle: `Conversa com ${profile.name}`,
    });
    if (profile.avatar_url) params.set('otherUserAvatarUrl', profile.avatar_url);
    router.push(`/messages?${params.toString()}`);
  };

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [reviewError, setReviewError] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);

  const myReview = useMemo(
    () => reviews.find((r) => r.reviewer_id === user?.id),
    [reviews, user?.id]
  );

  const updateProfileRating = (
    op: 'add' | 'edit' | 'remove',
    prevRating: number,
    newRating: number
  ) => {
    setProfile((p) => {
      if (!p) return p;
      let count = p.rating_count;
      let sum = p.rating_average * count;
      if (op === 'add') {
        sum += newRating;
        count += 1;
      } else if (op === 'edit') {
        sum += newRating - prevRating;
      } else {
        sum -= prevRating;
        count = Math.max(0, count - 1);
      }
      const avg = count === 0 ? 0 : Math.round((sum / count) * 100) / 100;
      return { ...p, rating_average: avg, rating_count: count };
    });
  };

  const openReviewForm = (review?: Review) => {
    setEditingReviewId(review?.id ?? null);
    setReviewRating(review?.rating ?? 0);
    setReviewComment(review?.comment ?? '');
    setReviewError('');
    setReviewFormOpen(true);
  };

  const closeReviewForm = () => {
    setReviewFormOpen(false);
    setEditingReviewId(null);
    setReviewRating(0);
    setReviewComment('');
    setReviewError('');
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewRating < 1) {
      setReviewError('Selecione uma nota de 1 a 5.');
      return;
    }
    setReviewBusy(true);
    setReviewError('');
    try {
      if (editingReviewId) {
        await updateReview(editingReviewId, {
          rating: reviewRating,
          comment: reviewComment.trim(),
        });
        updateProfileRating('edit', myReview?.rating ?? reviewRating, reviewRating);
      } else {
        await createReview({
          reviewee_id: id,
          rating: reviewRating,
          comment: reviewComment.trim(),
        });
        updateProfileRating('add', 0, reviewRating);
      }
      await loadTab();
      closeReviewForm();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : '';
      setReviewError(message || 'Não foi possível salvar a avaliação.');
    } finally {
      setReviewBusy(false);
    }
  };

  const removeMyReview = async (review: Review) => {
    if (!window.confirm('Remover sua avaliação deste vendedor?')) return;
    setReviewBusy(true);
    setReviewError('');
    try {
      await deleteReview(review.id);
      if (editingReviewId === review.id) closeReviewForm();
      updateProfileRating('remove', review.rating, 0);
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : '';
      setReviewError(message || 'Não foi possível remover a avaliação.');
    } finally {
      setReviewBusy(false);
    }
  };

  if (loading) return <PageSpinner />;

  if (error || !profile) {
    return (
      <PageShell>
        <EmptyState title="Perfil não encontrado" description={error || 'Este usuário não existe.'} />
      </PageShell>
    );
  }

  const year = new Date(profile.member_since).getFullYear();
  const locationBits = [profile.city, profile.state].filter(Boolean);

  return (
    <PageShell>
      {/* Banner */}
      <div className="relative -mx-4 sm:-mx-6 mb-0">
        <div className="h-40 sm:h-52 w-full bg-subtle overflow-hidden">
          {profile.banner_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveImageUrl(profile.banner_url)}
              alt=""
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-100" />
          )}
        </div>
      </div>

      {/* Identity */}
      <div className="relative px-1 pt-0 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-canvas border-4 border-canvas shadow-sm flex items-center justify-center type-title text-ink shrink-0">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveImageUrl(profile.avatar_url)}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              profile.name.charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0 pt-2 sm:pt-12">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="type-title text-ink truncate">{profile.name}</h1>
              {profile.is_featured ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-ink text-white">
                  loja em destaque
                </span>
              ) : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <Stars average={profile.rating_average} count={profile.rating_count} />
              <span className={metaClass}>no Fazbrike desde {year}</span>
              {locationBits.length ? <span className={metaClass}>{locationBits.join(', ')}</span> : null}
            </div>
            {profile.bio ? (
              <p className="type-body text-muted mt-3 whitespace-pre-line max-w-2xl">{profile.bio}</p>
            ) : null}
          </div>

          {!isOwner ? (
            <div className="flex flex-wrap gap-2 sm:pb-1">
              <button
                type="button"
                className={profile.is_following ? btnSecondaryClass : btnPrimaryClass}
                onClick={onFollow}
                disabled={followBusy}
              >
                {profile.is_following ? 'seguindo' : 'seguir'}
              </button>
              <button type="button" className={btnSecondaryClass} onClick={onChat}>
                conversar
              </button>
            </div>
          ) : (
            <Link href="/perfil" className={`${btnSecondaryClass} sm:mb-1`}>
              editar perfil
            </Link>
          )}
        </div>
      </div>

      {/* Tabs + shop search */}
      <div className="border-b border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-0 mb-6">
        <nav className="flex gap-4 overflow-x-auto text-sm" aria-label="Seções da loja">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap pb-3 border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-ink text-ink font-medium'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        {tab === 'for_sale' ? (
          <form
            className="sm:w-64 shrink-0 pb-2"
            onSubmit={(e) => {
              e.preventDefault();
              loadTab();
            }}
          >
            <input
              className={fieldClass}
              placeholder="buscar nessa loja"
              value={shopQuery}
              onChange={(e) => setShopQuery(e.target.value)}
            />
          </form>
        ) : null}
      </div>

      {tabLoading ? (
        <ListingSkeleton />
      ) : tab === 'followers' || tab === 'following' ? (
        people.length === 0 ? (
          <EmptyState title="Ninguém por aqui" description="Ainda não há usuários nesta lista." />
        ) : (
          <ul className="divide-y divide-line">
            {people.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/usuario/${p.id}`}
                  className="flex items-center gap-3 py-3 hover:bg-subtle/50 px-1"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-subtle flex items-center justify-center text-sm font-medium">
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={resolveImageUrl(p.avatar_url)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      p.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="type-body text-ink">{p.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : tab === 'reviews' ? (
        <div className="space-y-6">
          {!isOwner ? (
            isAuthenticated ? (
              myReview && !reviewFormOpen ? (
                <div className="border border-ink p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="type-meta font-medium text-ink">Sua avaliação</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={btnSecondaryClass}
                        onClick={() => openReviewForm(myReview)}
                        disabled={reviewBusy}
                      >
                        editar
                      </button>
                      <button
                        type="button"
                        className={btnDangerClass}
                        onClick={() => removeMyReview(myReview)}
                        disabled={reviewBusy}
                      >
                        remover
                      </button>
                    </div>
                  </div>
                  <Stars average={myReview.rating} />
                  {myReview.comment ? (
                    <p className="type-body text-muted whitespace-pre-line">{myReview.comment}</p>
                  ) : null}
                  <p className={metaClass}>{new Date(myReview.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              ) : reviewFormOpen ? (
                <form onSubmit={submitReview} className="border border-line p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="type-title text-ink">
                      {editingReviewId ? 'Editar avaliação' : 'Avaliar este vendedor'}
                    </h3>
                    <button
                      type="button"
                      className={btnSecondaryClass}
                      onClick={closeReviewForm}
                      disabled={reviewBusy}
                    >
                      cancelar
                    </button>
                  </div>

                  {reviewError ? (
                    <div className={errorBannerClass} role="alert">
                      {reviewError}
                    </div>
                  ) : null}

                  <div>
                    <label htmlFor="review-rating" className={labelClass}>
                      Nota
                    </label>
                    <StarPicker value={reviewRating} onChange={setReviewRating} />
                  </div>

                  <div>
                    <label htmlFor="review-comment" className={labelClass}>
                      Comentário (opcional)
                    </label>
                    <textarea
                      id="review-comment"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className={`${fieldClass} min-h-24 resize-y`}
                      placeholder="Conte como foi sua experiência com este vendedor…"
                      maxLength={1000}
                    />
                  </div>

                  <button type="submit" disabled={reviewBusy} className={btnPrimaryClass}>
                    {reviewBusy
                      ? 'Salvando...'
                      : editingReviewId
                        ? 'Salvar alterações'
                        : 'Publicar avaliação'}
                  </button>
                </form>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 border border-line p-4">
                  <div>
                    <p className="type-body text-ink">Comprou ou negociou com este vendedor?</p>
                    <p className={`${metaClass} mt-1`}>Sua avaliação ajuda a comunidade a confiar.</p>
                  </div>
                  <button type="button" className={btnPrimaryClass} onClick={() => openReviewForm()}>
                    avaliar este vendedor
                  </button>
                </div>
              )
            ) : (
              <p className={`${metaClass} border border-line p-4`}>
                <Link href="/login" className="underline underline-offset-2 hover:text-ink">
                  Entre
                </Link>{' '}
                para avaliar este vendedor.
              </p>
            )
          ) : null}

          {reviews.length === 0 ? (
            <EmptyState title="Sem avaliações" description="Este vendedor ainda não recebeu avaliações." />
          ) : (
            <ul className="space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className="border border-line p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-subtle flex items-center justify-center text-xs font-medium shrink-0">
                        {r.reviewer?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={resolveImageUrl(r.reviewer.avatar_url)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (r.reviewer?.name || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/usuario/${r.reviewer_id}`}
                          className="font-medium text-ink underline-offset-2 hover:underline truncate"
                        >
                          {r.reviewer?.name || `Usuário #${r.reviewer_id}`}
                        </Link>
                        <p className={metaClass}>{new Date(r.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <Stars average={r.rating} />
                  </div>
                  {r.comment ? (
                    <p className="type-body text-muted mt-2 whitespace-pre-line">{r.comment}</p>
                  ) : null}
                  {r.reviewer_id === user?.id ? (
                    <p className={`${metaClass} mt-2`}>sua avaliação</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={tab === 'sold' ? 'Nada vendido ainda' : tab === 'favorites' ? 'Sem favoritos' : 'Nenhum anúncio'}
          description="Quando houver itens, eles aparecem aqui."
        />
      ) : (
        <div className={listingGridClass}>
          {items.map((item) => (
            <ProductCard
              key={item.id}
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
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
