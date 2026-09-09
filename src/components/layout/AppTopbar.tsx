'use client';

import Logo from '@/components/Logo';
import { Bell, Search } from 'lucide-react';
import SinoNotificacoes from '@/components/notificacoes/SinoNotificacoes';

export default function AppTopbar({
  nome,
  funcao,
  iniciais,
}: {
  nome: string;
  funcao: string;
  iniciais: string;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-line bg-surface/80 px-8 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
          <input
            type="search"
            placeholder="Pesquisar…"
            className="w-72 rounded-full border border-line bg-canvas py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-muted/50 focus:border-forest focus:outline-none focus:ring-4 focus:ring-forest/10"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SinoNotificacoes />
        <div className="h-8 w-px bg-line" />
        <div className="flex items-center gap-3">
          <div className="hidden text-right md:block">
            <p className="text-sm font-semibold text-ink">{nome}</p>
            <p className="text-xs text-muted">{funcao}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-sm font-bold text-white">
            {iniciais}
          </span>
        </div>
      </div>
    </header>
  );
}
