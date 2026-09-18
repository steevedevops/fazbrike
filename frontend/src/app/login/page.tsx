'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/LoginForm';
import { RegisterForm } from '@/components/RegisterForm';
import { PageSpinner } from '@/components/PageShell';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/Logo';
import { cx, panelClass } from '@/lib/ui-classes';

const brandPoints = [
  'Milhares de anúncios novos todos os dias',
  'Negocie direto com quem vende',
  'Anuncie grátis em poucos minutos',
];

type Mode = 'login' | 'register';

const tabs: Array<{ id: Mode; label: string }> = [
  { id: 'login', label: 'Entrar' },
  { id: 'register', label: 'Criar conta' },
];

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/perfil');
    }
  }, [loading, isAuthenticated, router]);

  if (loading || isAuthenticated) {
    return <PageSpinner />;
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col lg:flex-row">
      <aside className="hidden lg:flex lg:w-[46%] xl:w-[52%] bg-ink text-white relative overflow-hidden flex-col justify-between p-10 xl:p-14">
        <div aria-hidden className="absolute inset-0">
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full border border-white/10" />
          <div className="absolute -top-10 -right-10 h-52 w-52 rounded-full border border-white/10" />
          <div className="absolute bottom-0 -left-20 h-64 w-64 rounded-full border border-white/10" />
        </div>

        <div className="relative flex items-center gap-2.5">
          <Logo href="/" markSize={40} showWordmark={false} />
          <span className="text-lg font-extrabold tracking-tight text-white leading-none">fazbrike</span>
        </div>

        <div className="relative max-w-md">
          <div className="h-px w-12 bg-brand-500 mb-6" aria-hidden />
          <h1 className="type-display text-white mb-6">Compre e venda perto de você.</h1>
          <ul className="space-y-4">
            {brandPoints.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex items-center justify-center h-5 w-5 rounded-full border border-white/20 shrink-0">
                  <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="type-body text-white/80">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative type-meta text-white/50">Compre. Venda. Negocie.</div>
      </aside>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 lg:py-0">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6 flex items-center justify-center gap-2">
            <Logo href="/" markSize={36} showWordmark={false} />
            <span className="text-[17px] font-extrabold tracking-tight text-ink leading-none">fazbrike</span>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 type-meta font-medium text-muted hover:text-ink mb-6 transition-colors"
          >
            <span aria-hidden>←</span> voltar à loja
          </Link>

          <div className={`${panelClass} p-6 sm:p-8 animate-panel-in`}>
            <div role="tablist" aria-label="Autenticação" className="grid grid-cols-2 gap-1 mb-8 rounded-control bg-subtle p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={mode === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setMode(tab.id)}
                  className={cx(
                    'min-h-10 rounded-[10px] type-body font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                    mode === tab.id ? 'bg-ink text-white shadow-sm' : 'text-muted hover:text-ink'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {mode === 'login' ? <LoginForm /> : <RegisterForm />}
          </div>
        </div>
      </main>
    </div>
  );
}
