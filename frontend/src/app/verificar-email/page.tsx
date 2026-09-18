'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { VerifyEmailForm } from '@/components/VerifyEmailForm';
import { PageSpinner } from '@/components/PageShell';
import { panelClass } from '@/lib/ui-classes';

export default function VerifyEmailPage() {
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
          <h1 className="type-display text-white mb-6">Confirme seu e-mail.</h1>
          <p className="type-body text-white/80">Falta pouco para você começar a comprar e vender no Fazbrike.</p>
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
            href="/login"
            className="inline-flex items-center gap-1.5 type-meta font-medium text-muted hover:text-ink mb-6 transition-colors"
          >
            <span aria-hidden>←</span> voltar ao login
          </Link>

          <div className={`${panelClass} p-6 sm:p-8 animate-panel-in`}>
            <Suspense fallback={<PageSpinner />}>
              <VerifyEmailForm />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
