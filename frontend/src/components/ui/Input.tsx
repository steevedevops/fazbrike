import React from 'react';
import { cx, fieldClass, fieldErrorClass, helpClass, labelClass } from '@/lib/ui-classes';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className = '',
  id,
  ...props
}) => {
  const fieldId = id || props.name;

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={fieldId} className={labelClass}>
          {label}
        </label>
      ) : null}
      <div className="relative">
        {icon ? (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
            {icon}
          </div>
        ) : null}
        <input
          id={fieldId}
          className={cx(fieldClass, icon ? 'pl-10' : undefined, error ? fieldErrorClass : undefined, className)}
          aria-invalid={error ? true : undefined}
          {...props}
        />
      </div>
      {error ? (
        <p className={`${helpClass} text-danger`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};
