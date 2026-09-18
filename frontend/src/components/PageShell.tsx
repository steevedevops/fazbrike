import React, { Suspense } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { cx } from '@/lib/ui-classes';

type Width = 'full' | 'wide' | 'form' | 'narrow';

const widthClasses: Record<Width, string> = {
  full: 'max-w-[var(--layout-max)]',
  wide: 'max-w-[var(--layout-max)]',
  form: 'max-w-3xl',
  narrow: 'max-w-4xl',
};

interface PageShellProps {
  children: React.ReactNode;
  width?: Width;
  showFooter?: boolean;
  flush?: boolean;
  className?: string;
}

export function PageShell({
  children,
  width = 'wide',
  showFooter = true,
  flush = false,
  className = '',
}: PageShellProps) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <a href="#conteudo-principal" className="skip-link">
        Ir para o conteúdo
      </a>
      <Suspense fallback={<div className="h-[68px] border-b border-[color:var(--color-border)] bg-surface" />}>
        <Header />
      </Suspense>
      <main id="conteudo-principal" className="flex-1 pt-[68px]">
        {flush ? (
          children
        ) : (
          <div
            className={cx(
              'w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16',
              widthClasses[width],
              className
            )}
          >
            {children}
          </div>
        )}
      </main>
      {showFooter ? <Footer /> : null}
    </div>
  );
}

export function PageSpinner() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <div
        className="animate-spin rounded-full h-10 w-10 border-2 border-[color:var(--color-border)] border-t-brand-500"
        role="status"
        aria-label="Carregando"
      />
    </div>
  );
}
