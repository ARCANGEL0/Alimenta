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
  const segmentos = pathname.split('/').filter(Boolean);
  const migalhas = segmentos.map((_, i) => '/' + segmentos.slice(0, i + 1).join('/'));

  return (
    <nav className="flex flex-wrap items-center gap-1 text-xs text-muted">
      {migalhas.map((href, i) => {
        const eUltimo = i === migalhas.length - 1;
        return (
          <span key={href} className="flex items-center gap-1">
            {!eUltimo && <ChevronRight className="w-3 h-3" />}
            {labels[href] ?? href}
          </span>
        );
      })}
    </nav>
  );
}
