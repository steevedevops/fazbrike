'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { ApiError } from '@/lib/services/api';
import { PasswordInput } from '@/components/PasswordInput';
import { SocialLoginButtons } from '@/components/SocialLoginButtons';
import {
  btnInkClass,
  btnSecondaryClass,
  cx,
  errorBannerClass,
  fieldClass,
  fieldErrorClass,
  labelClass,
} from '@/lib/ui-classes';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
  terms?: string;
};

type Strength = { score: number; label: string; bar: string; text: string };

const STRENGTHS: Strength[] = [
  { score: 1, label: 'Fraca', bar: 'bg-danger', text: 'text-danger' },
  { score: 2, label: 'Média', bar: 'bg-brand-500', text: 'text-brand-600' },
  { score: 3, label: 'Forte', bar: 'bg-success', text: 'text-success' },
];

function getStrength(password: string): Strength | null {
  if (!password) return null;

  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Za-z]/.test(password) && /\d/.test(password)) score += 1;
  score = Math.max(1, Math.min(3, score));

  return STRENGTHS[score - 1];
}

export const RegisterForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [step, setStep] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { register } = useAuth();

  const strength = getStrength(password);
  const confirmMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const confirmErrorText = fieldErrors.confirm ?? (confirmMismatch ? 'As senhas não coincidem.' : '');

  const clearFieldError = (field: keyof FieldErrors) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (current: number): FieldErrors => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const errors: FieldErrors = {};
    if (current === 0) {
      if (trimmedName.length < 2) errors.name = 'Informe seu nome completo.';
      if (!EMAIL_RE.test(trimmedEmail)) errors.email = 'Informe um email válido.';
    }
    if (current === 1) {
      if (password.length < 6) errors.password = 'A senha deve ter pelo menos 6 caracteres.';
      if (confirmPassword.length === 0) errors.confirm = 'Confirme sua senha.';
      else if (password !== confirmPassword) errors.confirm = 'As senhas não coincidem.';
    }
    if (current === 2 && !acceptTerms) {
      errors.terms = 'Aceite os Termos de uso e a Política de privacidade para continuar.';
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const errors = validateStep(step);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    if (step < 2) {
      setFieldErrors({});
      setStep(step + 1);
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    setLoading(true);

    try {
      await register(trimmedName, trimmedEmail, password, acceptTerms);
      router.push(`/verificar-email?email=${encodeURIComponent(trimmedEmail)}`);
    } catch (err) {
      setError((err as ApiError)?.message || 'Não foi possível criar a conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="panel-register" role="tabpanel" aria-labelledby="tab-register" className="animate-fade-in">
      <p className="type-body font-semibold text-ink mb-1">Passo {step + 1} de 3</p>
      <p className="type-body text-muted mb-6">
        {step === 0
          ? 'Junte-se à comunidade Fazbrike.'
          : step === 1
            ? 'Escolha uma senha para entrar depois.'
            : 'Aceite os termos para abrir a conta.'}
      </p>

      {error ? (
        <div className={errorBannerClass} role="alert">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {step === 0 ? (
        <>
        <div>
          <label htmlFor="name" className={labelClass}>
            Nome completo
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearFieldError('name');
            }}
            required
            autoComplete="name"
            className={cx(fieldClass, fieldErrors.name && fieldErrorClass)}
            placeholder="Seu nome completo"
            aria-invalid={!!fieldErrors.name || undefined}
            aria-describedby={fieldErrors.name ? 'register-name-error' : undefined}
          />
          {fieldErrors.name ? (
            <p id="register-name-error" className="type-meta text-danger mt-1.5">
              {fieldErrors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (EMAIL_RE.test(e.target.value.trim())) clearFieldError('email');
            }}
            required
            autoComplete="email"
            className={cx(fieldClass, fieldErrors.email && fieldErrorClass)}
            placeholder="seu@email.com"
            aria-invalid={!!fieldErrors.email || undefined}
            aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
          />
          {fieldErrors.email ? (
            <p id="register-email-error" className="type-meta text-danger mt-1.5">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>
        </>
        ) : null}

        {step === 1 ? (
        <>
        <div>
          <label htmlFor="password" className={labelClass}>
            Senha
          </label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(value) => {
              setPassword(value);
              if (fieldErrors.password && value.length >= 6) clearFieldError('password');
            }}
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            invalid={!!fieldErrors.password}
            ariaDescribedBy={
              fieldErrors.password ? 'register-password-error' : strength ? 'register-password-strength' : undefined
            }
          />
          {strength ? (
            <div className="mt-2">
              <div className="flex gap-1.5" aria-hidden>
                {[1, 2, 3].map((bar) => (
                  <span
                    key={bar}
                    className={cx('h-1 flex-1 rounded-full', bar <= strength.score ? strength.bar : 'bg-subtle')}
                  />
                ))}
              </div>
              <p id="register-password-strength" className="type-meta mt-1.5">
                <span className={strength.text}>Força da senha: {strength.label}</span>
              </p>
            </div>
          ) : null}
          {fieldErrors.password ? (
            <p id="register-password-error" className="type-meta text-danger mt-1.5">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="confirmPassword" className={labelClass}>
            Confirmar senha
          </label>
          <PasswordInput
            id="confirmPassword"
            value={confirmPassword}
            onChange={(value) => {
              setConfirmPassword(value);
              if (fieldErrors.confirm && value === password) clearFieldError('confirm');
            }}
            autoComplete="new-password"
            placeholder="Confirme sua senha"
            invalid={!!confirmErrorText}
            ariaDescribedBy={confirmErrorText ? 'register-confirm-error' : undefined}
          />
          {confirmErrorText ? (
            <p id="register-confirm-error" className="type-meta text-danger mt-1.5">
              {confirmErrorText}
            </p>
          ) : null}
        </div>
        </>
        ) : null}

        {step === 2 ? (
        <div>
          <label htmlFor="accept-terms" className="flex items-start gap-3 type-meta text-muted">
            <input
              id="accept-terms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => {
                setAcceptTerms(e.target.checked);
                clearFieldError('terms');
              }}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--color-ink)]"
              aria-invalid={fieldErrors.terms ? true : undefined}
              aria-describedby={fieldErrors.terms ? 'register-terms-error' : undefined}
            />
            <span>
              Li e aceito os{' '}
              <Link href="/termos-de-uso" target="_blank" className="underline text-ink">
                Termos de uso
              </Link>{' '}
              e a{' '}
              <Link href="/politica-de-privacidade" target="_blank" className="underline text-ink">
                Política de privacidade
              </Link>
              , e declaro ter 18 anos ou mais.
            </span>
          </label>
          {fieldErrors.terms ? (
            <p id="register-terms-error" className="type-meta text-danger mt-1.5">
              {fieldErrors.terms}
            </p>
          ) : null}
        </div>
        ) : null}

        <div className="flex gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => {
                setError('');
                setStep(step - 1);
              }}
              className={cx(btnSecondaryClass, 'min-w-28')}
            >
              Voltar
            </button>
          ) : null}
          <button type="submit" disabled={loading} className={cx(btnInkClass, 'flex-1')}>
            {step < 2 ? 'Continuar' : loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </div>
      </form>
      {step === 0 ? <SocialLoginButtons /> : null}
    </div>
  );
};