'use client';

import Logo from '@/components/Logo';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Truck,
  Package,
  Clock,
  Users,
  ShieldAlert,
  Trash2,
  HeartHandshake,
  BarChart3,
  Settings,
  LogOut,
  Leaf,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { href: '/doacoes', label: 'Doações', icon: Truck },
  { href: '/inventario', label: 'Inventário', icon: Package },
  { href: '/expirations', label: 'Validades', icon: Clock },
  { href: '/beneficiarios', label: 'Beneficiários', icon: Users },
  { href: '/distribuicoes', label: 'Distribuições', icon: ShieldAlert },
  { href: '/descartes', label: 'Descartes', icon: Trash2 },
  { href: '/doadores', label: 'Doadores', icon: HeartHandshake },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/usuarios', label: 'Utilizadores', icon: Users },
  { href: '/settings', label: 'Definições', icon: Settings },
];

const grupos = [
  { label: 'Principal', itens: navItems.slice(0, 5) },
  { label: 'Operações', itens: navItems.slice(5, 9) },
  { label: 'Administração', itens: navItems.slice(9) },
];

export default function AppSidebar({
  nome,
  email,
  iniciais,
}: {
  nome: string;
  email: string;
  iniciais: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function terminarSessao() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-full w-[248px] flex-col border-r border-line bg-surface">
      {/* Logo */}
      <div className="flex h-[72px] items-center gap-2.5 border-b border-line px-6">
        <Logo size="md" />
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        {grupos.map((grupo) => (
          <div key={grupo.label} className="mb-6">
            <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted/70">
              {grupo.label}
            </h3>
            {grupo.itens.map((item) => {
              const ativo = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    ativo
                      ? 'bg-forest text-white shadow-sm shadow-forest/20'
                      : 'text-ink/60 hover:bg-forest/5 hover:text-forest'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Rodapé */}
      <div className="border-t border-line p-4">
        <div className="flex items-center gap-3 rounded-xl bg-canvas px-3 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest/10 text-sm font-bold text-forest">
            {iniciais}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{nome}</p>
            <p className="truncate text-xs text-muted">{email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={terminarSessao}
          className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-danger/5 hover:text-danger"
        >
          <LogOut className="h-4 w-4" />
          Terminar sessão
        </button>
      </div>
    </aside>
  );
}
