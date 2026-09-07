'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

const variantClasses: Record<string, string> = {
  default: 'bg-forest text-white hover:bg-green-700',
  destructive: 'bg-danger text-white hover:bg-red-600',
  outline: 'border border-gray-300 bg-surface hover:bg-canvas',
  secondary: 'bg-gray-200 text-ink hover:bg-gray-300',
  ghost: 'hover:bg-gray-100',
  link: 'text-forest underline-offset-4 hover:underline',
};

const sizeClasses: Record<string, string> = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-md px-3',
  lg: 'h-11 rounded-md px-8',
  icon: 'h-10 w-10',
};

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ref,
  ...props
}: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  const classes = cn(
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
  if (asChild) {
    return (
      <a
        className={classes}
        ref={ref as React.Ref<HTMLAnchorElement>}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      />
    );
  }
  return <button className={classes} ref={ref} {...props} />;
}

export { Button };

export default Button;
