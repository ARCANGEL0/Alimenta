'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'danger';
  size?: 'default' | 'sm' | 'lg';
}

const variantClasses: Record<string, string> = {
  default: 'bg-forest text-white',
  secondary: 'bg-gray-200 text-ink',
  destructive: 'bg-danger text-white',
  outline: 'border border-gray-300 bg-surface',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-warning-100 text-warning-800',
  danger: 'bg-danger-100 text-danger-800',
};

const sizeClasses: Record<string, string> = {
  default: 'px-2.5 py-0.5 text-xs',
  sm: 'px-2 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border transition-colors',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };

export type { BadgeProps };