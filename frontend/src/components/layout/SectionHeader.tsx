import React from 'react';
import Link from 'next/link';
import { metaClass, navLinkClass, sectionTitleClass } from '@/lib/ui-classes';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  divider?: boolean;
}

export function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel = 'Ver todas',
  divider = true,
}: SectionHeaderProps) {
  return (
    <div
      className={`mb-5 flex items-end justify-between gap-4 ${
        divider ? 'border-b border-[color:var(--color-border)] pb-4' : ''
      }`}
    >
      <div className="min-w-0">
        <h2 className={sectionTitleClass}>{title}</h2>
        {subtitle ? <p className={`${metaClass} mt-1`}>{subtitle}</p> : null}
      </div>
      {href ? (
        <Link href={href} className={`${navLinkClass} shrink-0`}>
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
