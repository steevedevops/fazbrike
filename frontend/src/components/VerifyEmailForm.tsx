'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { ApiError } from '@/lib/services/api';
import {
  btnGhostClass,
  btnInkClass,
  cx,
  errorBannerClass,
  fieldClass,
  fieldErrorClass,
  labelClass,
} from '@/lib/ui-classes';

const CODE_RE = /^\d{6}$/;
const RESEND_COOLDOWN_SECONDS = 60;
const successBannerClass = 'mb-6 p-4 bg-green-50 text-success rounded-control type-meta';

export const VerifyEmailForm: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyEmailCode, resendEmailCode } = useAuth();

  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    const trimmedEmail = email.trim();
    const trimmedCode = code.trim();
    if (!trimmedEmail) {
      setError('Informe o e-mail usado no cadastro.');
      return;
    }
    if (!CODE_RE.test(trimmedCode)) {
      setError('Informe o código de 6 dígitos enviado por e-mail.');
      return;
    }

    setLoading(true);
    try {
      await verifyEmailCode(trimmedEmail, trimmedCode);
      router.push('/');
    } catch (err) {
      setError((err as ApiError)?.message || 'Não foi possível verificar o código.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Informe o e-mail usado no cadastro.');
      return;
    }

    setResending(true);
    try {
      const data = await resendEmailCode(trimmedEmail);
      setInfo(data.message || 'Código reenviado para o seu e-mail.');
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError((err as ApiError)?.message || 'Não foi possível reenviar o código.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <p className="type-body text-muted mb-6">
        Enviamos um código de 6 dígitos para o seu e-mail. Informe-o abaixo para ativar sua conta.
      </p>

      {error ? (
        <div className={errorBannerClass} role="alert">
          {error}
        </div>
      ) : null}
      {info ? (
        <div className={successBannerClass} role="status">
          {info}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="verify-email" className={labelClass}>
            Email
          </label>
          <input
            type="email"
            id="verify-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={fieldClass}
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <label htmlFor="verify-code" className={labelClass}>
            Código de verificação
          </label>
          <input
            type="text"
            id="verify-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className={cx(fieldClass, 'text-center tracking-[6px] text-lg font-semibold', error && fieldErrorClass)}
            placeholder="000000"
          />
        </div>

        <button type="submit" disabled={loading} className={`${btnInkClass} w-full`}>
          {loading ? 'Verificando...' : 'Verificar código'}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending || secondsLeft > 0}
          className={`${btnGhostClass} w-full`}
        >
          {resending
            ? 'Reenviando...'
            : secondsLeft > 0
              ? `Reenviar código em ${secondsLeft}s`
              : 'Reenviar código'}
        </button>
      </form>
    </div>
  );
};
