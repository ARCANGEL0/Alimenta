'use client';

import { cn } from '@/lib/utils';

interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

export default function Reveal({ children, className, delay = 0, y = 24 }: Props) {
  return (
    <div
      className={cn('reveal', className)}
      style={{ '--reveal-y': `${y}px`, '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
