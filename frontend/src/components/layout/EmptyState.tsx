import React from 'react';
import { metaClass, panelClass, sectionTitleClass } from '@/lib/ui-classes';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className={`${panelClass} px-6 py-12 text-center`}>
      <p className={sectionTitleClass}>{title}</p>
      {description ? <p className={`${metaClass} mt-2 max-w-md mx-auto`}>{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
