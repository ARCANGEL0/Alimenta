'use client';

import { useEffect, useRef, useState } from 'react';

export function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setInView(true);
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px', ...options }
    );
    obs.observe(el);

    const fallback = setTimeout(() => setInView(true), 1200);
    return () => {
      obs.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return { ref, inView };
}
