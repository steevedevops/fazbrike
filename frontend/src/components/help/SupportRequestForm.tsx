'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { createSupportRequest, type SupportTopic } from '@/lib/services/api';
import { SUPPORT_TOPICS } from '@/lib/legal';
import {
  btnInkClass,
  btnSecondaryClass,
  cx,
  errorBannerClass,
  fieldClass,
  helpClass,
  labelClass,
  metaClass,
  panelClass,
  sectionTitleClass,
} from '@/lib/ui-classes';


const EMAIL_RE = /^\S+@\S+\.\S+$/;

interface SupportRequestFormProps {
  initialTopic?: SupportTopic;
  itemId?: number;
}

export function SupportRequestForm({ initialTopic = 'conta', itemId }: SupportRequestFormProps) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<SupportTopic>(initialTopic);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!isAuthenticated) {
      if (name.trim().length < 2) return setError('Informe seu nome.');
      if (!EMAIL_RE.test(email.trim())) return setError('Informe um e-mail válido para receber a resposta.');
    }
    if (subject.trim().length < 3) return setError('Escreva um título com pelo menos 3 caracteres.');
    if (message.trim().length < 10) return setError('Descreva o problema com pelo menos 10 caracteres.');

    setSending(true);
    try {
      const response = await createSupportRequest({
        name: isAuthenticated ? undefined : name.trim(),
        email: isAuthenticated ? undefined : email.trim(),
        topic,
        subject: subject.trim(),
        message: message.trim(),
        item_id: itemId,
      });
      setSuccess(response.message);
      setSubject('');
      setMessage('');
    } catch (err) {
      const text = err && typeof err === 'object' && 'message' in err ? String((err as { message?: unknown }).message) : '';
      setError(text || 'Não foi possível enviar o chamado.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contato" aria-labelledby="contato-title" className={cx(panelClass, 'p-6 scroll-mt-24')}>
      <h2 id="contato-title" className={sectionTitleClass}>
        Fale com a gente
      </h2>
      <p className={cx(metaClass, 'mt-1')}>
        Não encontrou a resposta? Abra um chamado — respondemos em até 2 dias úteis.
        {isAuthenticated ? (
          <>
            {' '}
            Acompanhe em{' '}
            <Link href="/ajuda/chamados" className="underline text-ink">
              Meus chamados
            </Link>
            .
          </>
        ) : null}
      </p>

      {success ? (
        <div className="mt-5 rounded-control bg-subtle p-4" role="status">
          <p className="type-body text-ink font-medium">{success}</p>
          <p className={cx(metaClass, 'mt-1')}>
            {isAuthenticated
              ? 'A resposta aparece em Meus chamados.'
              : 'Vamos responder no e-mail informado.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {isAuthenticated ? (
              <Link href="/ajuda/chamados" className={btnInkClass}>
                Ver meus chamados
              </Link>
            ) : null}
            <button type="button" className={btnSecondaryClass} onClick={() => setSuccess('')}>
              Abrir outro chamado
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          {error ? (
            <div className={errorBannerClass} role="alert">
              {error}
            </div>
          ) : null}

          {authLoading ? null : isAuthenticated ? (
            <p className={metaClass}>
              Enviando como <span className="text-ink font-medium">{user?.name}</span> ({user?.email}).
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="support-name" className={labelClass}>
                  Nome
                </label>
                <input id="support-name" className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoComplete="name" />
              </div>
              <div>
                <label htmlFor="support-email" className={labelClass}>
                  E-mail para resposta
                </label>
                <input id="support-email" type="email" className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} autoComplete="email" />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="support-topic" className={labelClass}>
              Assunto
            </label>
            <select id="support-topic" className={fieldClass} value={topic} onChange={(e) => setTopic(e.target.value as SupportTopic)}>
              {SUPPORT_TOPICS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {topic === 'exclusao_conta' && !isAuthenticated ? (
              <p className={helpClass}>Para excluir a conta, entre com ela antes de abrir o chamado — assim confirmamos que o pedido é seu.</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="support-subject" className={labelClass}>
              Título
            </label>
            <input id="support-subject" className={fieldClass} value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={120} placeholder="Resuma o problema em poucas palavras" />
          </div>

          <div>
            <label htmlFor="support-message" className={labelClass}>
              Mensagem
            </label>
            <textarea
              id="support-message"
              rows={5}
              className={fieldClass}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={3000}
              placeholder="Conte o que aconteceu, com o máximo de detalhes"
            />
            <p className={cx(helpClass, 'text-right')}>{message.length} / 3000</p>
          </div>

          <p className={metaClass}>
            Usamos esses dados só para responder ao seu chamado, conforme a{' '}
            <Link href="/politica-de-privacidade" className="underline text-ink">
              Política de privacidade
            </Link>
            .
          </p>

          <div className="flex justify-end">
            <button type="submit" className={btnInkClass} disabled={sending}>
              {sending ? 'Enviando...' : 'Enviar chamado'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
