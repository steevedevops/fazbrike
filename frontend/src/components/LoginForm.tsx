'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { ApiError } from '@/lib/services/api';
import { PasswordInput } from '@/components/PasswordInput';
import {
  btnInkClass,
  cx,
  errorBannerClass,
  fieldClass,
  fieldErrorClass,
  labelClass,
  metaClass,
} from '@/lib/ui-classes';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string }>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const remembered = localStorage.getItem('fazbrike_remember');
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  const canSubmit = email.trim() !== '' && password.length > 0 && !loading;

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (fieldErrors.email && EMAIL_RE.test(value.trim())) {
      setFieldErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setFieldErrors({ email: 'Informe um email válido.' });
      return;
    }

    setLoading(true);

    try {
      await login(trimmed, password);
      if (rememberMe) {
        localStorage.setItem('fazbrike_remember', trimmed);
      } else {
        localStorage.removeItem('fazbrike_remember');
      }
      router.push('/');
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError?.details?.email_verified === false) {
        router.push(`/verificar-email?email=${encodeURIComponent(trimmed)}`);
        return;
      }
      setError(apiError?.message || 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="panel-login" role="tabpanel" aria-labelledby="tab-login" className="animate-fade-in">
      <p className="type-body text-muted mb-6">Acesse sua conta para continuar.</p>

      {error ? (
        <div className={errorBannerClass} role="alert">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            required
            autoComplete="email"
            className={cx(fieldClass, fieldErrors.email && fieldErrorClass)}
            placeholder="seu@email.com"
            aria-invalid={!!fieldErrors.email || undefined}
            aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
          />
          {fieldErrors.email ? (
            <p id="login-email-error" className="type-meta text-danger mt-1.5">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            Senha
          </label>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            placeholder="Sua senha"
          />
        </div>

        <div className="flex items-center justify-between type-meta">
          <label className="flex items-center cursor-pointer select-none text-muted">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 border-[color:var(--color-border)] rounded-sm"
            />
            <span className="ml-2">Lembrar de mim</span>
          </label>
          <span className={metaClass}>Esqueceu a senha?</span>
        </div>

        <button type="submit" disabled={!canSubmit} className={`${btnInkClass} w-full`}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
};