import React from 'react';
import { cx, panelClass } from '@/lib/ui-classes';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
}) => {
  return <div className={cx(panelClass, className)}>{children}</div>;
};

interface CardSectionProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardSectionProps> = ({ children, className = '' }) => {
  return (
    <div className={cx('px-6 py-4 border-b border-[color:var(--color-border)]', className)}>
      {children}
    </div>
  );
};

export const CardContent: React.FC<CardSectionProps> = ({ children, className = '' }) => {
  return <div className={cx('px-6 py-4', className)}>{children}</div>;
};

export const CardFooter: React.FC<CardSectionProps> = ({ children, className = '' }) => {
  return (
    <div className={cx('px-6 py-4 border-t border-[color:var(--color-border)]', className)}>
      {children}
    </div>
  );
};
