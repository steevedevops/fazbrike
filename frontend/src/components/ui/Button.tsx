import React from 'react';
import {
  btnDangerClass,
  btnGhostClass,
  btnInkClass,
  btnPrimaryClass,
  btnSecondaryClass,
  cx,
} from '@/lib/ui-classes';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'ink';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses = {
  primary: btnPrimaryClass,
  secondary: btnSecondaryClass,
  accent: btnPrimaryClass,
  outline: btnSecondaryClass,
  ghost: btnGhostClass,
  danger: btnDangerClass,
  ink: btnInkClass,
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClass =
    size === 'sm' ? 'min-h-9 px-4 type-meta' : size === 'lg' ? 'min-h-12 px-6' : '';

  return (
    <button
      className={cx(variantClasses[variant], sizeClass, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : null}
      {children}
    </button>
  );
};
