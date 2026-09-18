import React from 'react';
import { pageLeadClass, pageTitleClass } from '@/lib/ui-classes';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className={pageTitleClass}>{title}</h1>
        {subtitle ? <p className={pageLeadClass}>{subtitle}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap items-center gap-3">{action}</div> : null}
    </header>
  );
}
