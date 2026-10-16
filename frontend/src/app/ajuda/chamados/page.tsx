'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageShell, PageSpinner } from '@/components/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { SUPPORT_TOPICS } from '@/lib/legal';
import { useAuth } from '@/hooks/useAuth';
import { fetchMySupportRequests, type SupportRequest } from '@/lib/services/api';
import { btnInkClass, cx, errorBannerClass, metaClass, panelClass } from '@/lib/ui-classes';

const STATUS_LABELS: Record<SupportRequest['status'], { label: string; className: string }> = {
  open: { label: 'Aguardando resposta', className: 'bg-subtle text-ink' },
  answered: { label: 'Respondido', className: 'bg-ink text-white' },
  closed: { label: 'Encerrado', className: 'bg-subtle text-muted' },
};

const formatDate = (value: string) => new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export default function MySupportRequestsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<SupportRequest[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    fetchMySupportRequests()
      .then(setRequests)
      .catch((err) => {
        const text = err && typeof err === 'object' && 'message' in err ? String((err as { message?: unknown }).message) : '';
        setError(text || 'Não foi possível carregar seus chamados.');
      });
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || (!requests && !error)) return <PageSpinner />;

  return (
    <PageShell width="narrow">
      <PageHeader
        title="Meus chamados"
        subtitle="Acompanhe as respostas da equipe do Fazbrike."
        action={
          <Link href="/ajuda#contato" className={btnInkClass}>
            Novo chamado
          </Link>
        }
      />

      {error ? (
        <div className={errorBannerClass} role="alert">
          {error}
        </div>
      ) : requests && requests.length === 0 ? (
        <EmptyState
          title="Você ainda não abriu chamados"
          description="Se precisar de ajuda, confira as perguntas frequentes ou fale com a equipe."
          action={
            <Link href="/ajuda" className={btnInkClass}>
              Ir para a central de ajuda
            </Link>
          }
        />
      ) : (
        <ul className="space-y-4">
          {requests?.map((request) => {
            const status = STATUS_LABELS[request.status] ?? STATUS_LABELS.open;
            const topic = SUPPORT_TOPICS.find((option) => option.value === request.topic)?.label ?? request.topic;
            return (
              <li key={request.id} className={cx(panelClass, 'p-5')}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="type-body font-medium text-ink break-words">{request.subject}</p>
                    <p className={cx(metaClass, 'mt-0.5')}>
                      #{request.id} · {topic} · {formatDate(request.created_at)}
                    </p>
                  </div>
                  <span className={cx('rounded-pill px-3 py-1 type-meta font-medium', status.className)}>{status.label}</span>
                </div>
                <p className={cx(metaClass, 'mt-3 whitespace-pre-line break-words')}>{request.message}</p>
                {request.response ? (
                  <div className="mt-4 rounded-control bg-subtle p-4">
                    <p className="type-meta font-semibold text-ink">
                      Resposta da equipe{request.responded_at ? ` · ${formatDate(request.responded_at)}` : ''}
                    </p>
                    <p className="type-body text-ink mt-1 whitespace-pre-line break-words">{request.response}</p>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
