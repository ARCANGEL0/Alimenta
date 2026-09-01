'use client';

import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

const labels: Record<string, string> = {
  '/dashboard': 'Visão geral',
  '/donations': 'Doações',
  '/inventory': 'Inventário',
  '/expirations': 'Validades',
  '/beneficiaries': 'Beneficiários',
  '/distributions': 'Distribuições',
  '/disposals': 'Descarte',
  '/donors': 'Doadores',
  '/reports': 'Relatórios',
  '/users': 'Utilizadores',
  '/settings': 'Definições',
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((_, i) => '/' + segments.slice(0, i + 1).join('/'));

  return (
    <nav className="flex flex-wrap items-center gap-1 text-xs text-muted">
      {crumbs.map((href, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={href} className="flex items-center gap-1">
            {!isLast && <ChevronRight className="w-3 h-3" />}
            {labels[href] ?? href}
          </span>
        );
      })}
    </nav>
  );
}
