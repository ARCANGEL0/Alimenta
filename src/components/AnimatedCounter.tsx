'use client';

import { useEffect, useState } from 'react';
import { useInView } from '@/hooks/useInView';

interface Props {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}

export default function AnimatedCounter({ value, suffix = '', prefix = '', decimals = 0, duration = 1600, className }: Props) {
  const { ref, inView } = useInView<HTMLSpanElement>();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{display.toFixed(decimals).replace('.', ',')}{suffix}
    </span>
  );
}
