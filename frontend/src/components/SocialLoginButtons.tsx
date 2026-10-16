'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { SocialLoginCancelled, type SocialProvider } from '@/lib/firebase';
import { cx, errorBannerClass } from '@/lib/ui-classes';

const baseButton =
  'w-full min-h-11 inline-flex items-center justify-center gap-3 rounded-control px-4 type-body font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2';

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.37 12.6c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.76 2.28-1.6 2.78-.41 6.9 1.15 9.16.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.42-3.65zM14.1 5.86c.63-.77 1.06-1.83.94-2.89-.91.04-2.02.61-2.67 1.37-.58.67-1.09 1.76-.96 2.8 1.02.08 2.06-.52 2.69-1.28z" />
    </svg>
  );
}

/** "Continuar com Google/Apple", usado nas abas Entrar e Criar conta. */
export function SocialLoginButtons() {
  const router = useRouter();
  const { socialLogin } = useAuth();
  const [busy, setBusy] = useState<SocialProvider | null>(null);
  const [error, setError] = useState('');

  const handle = async (provider: SocialProvider) => {
    setError('');
    setBusy(provider);
    try {
      await socialLogin(provider);
      // Recarrega a navegação para o Header ler a sessão nova do localStorage.
      router.push('/');
      router.refresh();
    } catch (err) {
      if (!(err instanceof SocialLoginCancelled)) {
        const text = err && typeof err === 'object' && 'message' in err ? String((err as { message?: unknown }).message) : '';
        setError(text || 'Não foi possível entrar agora. Tente novamente.');
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 mb-5" aria-hidden>
        <span className="h-px flex-1 bg-[color:var(--color-border)]" />
        <span className="type-meta text-muted">ou</span>
        <span className="h-px flex-1 bg-[color:var(--color-border)]" />
      </div>

      {error ? (
        <div className={cx(errorBannerClass, 'mb-4')} role="alert">
          {error}
        </div>
      ) : null}

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => handle('google')}
          disabled={busy !== null}
          className={cx(baseButton, 'bg-surface text-ink border border-[color:var(--color-border)] hover:bg-subtle')}
        >
          <GoogleIcon />
          {busy === 'google' ? 'Conectando...' : 'Continuar com Google'}
        </button>
        <button
          type="button"
          onClick={() => handle('apple')}
          disabled={busy !== null}
          className={cx(baseButton, 'bg-ink text-white hover:bg-neutral-800')}
        >
          <AppleIcon />
          {busy === 'apple' ? 'Conectando...' : 'Continuar com Apple'}
        </button>
      </div>

      <p className="type-meta text-muted mt-4">
        Ao continuar com Google ou Apple, você concorda com os{' '}
        <Link href="/termos-de-uso" target="_blank" className="underline text-ink">
          Termos de uso
        </Link>{' '}
        e a{' '}
        <Link href="/politica-de-privacidade" target="_blank" className="underline text-ink">
          Política de privacidade
        </Link>{' '}
        e declara ter 18 anos ou mais.
      </p>
    </div>
  );
}
