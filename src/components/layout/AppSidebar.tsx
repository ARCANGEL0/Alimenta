'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Truck,
  Package,
  Clock,
  Users,
  Trash2,
  Settings,
  ShieldAlert,
  LogOut,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { href: '/donations', label: 'Doações', icon: Truck },
  { href: '/inventory', label: 'Inventário', icon: Package },
  { href: '/expirations', label: 'Validades', icon: Clock },
  { href: '/beneficiaries', label: 'Beneficiários', icon: Users },
  { href: '/distributions', label: 'Distribuições', icon: ShieldAlert },
  { href: '/disposals', label: 'Descarte', icon: Trash2 },
  { href: '/donors', label: 'Doadores', icon: Users },
  { href: '/reports', label: 'Relatórios', icon: Clock },
  { href: '/users', label: 'Utilizadores', icon: ShieldAlert },
  { href: '/settings', label: 'Definições', icon: Settings },
];

const groups = [
  { label: 'Principal', items: navItems.slice(0, 5) },
  { label: 'Operações', items: navItems.slice(5, 9) },
  { label: 'Administração', items: navItems.slice(9) },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-62 bg-surface border-r border-gray-200 z-20">
      <div className="flex flex-col h-full">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="font-bold text-text tracking-tight">ALIMENTA</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {groups.map((group) => (
            <div key={group.label} className="mb-4">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider px-2 mb-2">
                {group.label}
              </h3>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-forest text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    {item.label}
                    {isActive && <ChevronRight className="ml-auto w-3 h-3 text-white" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <div className="px-3">
            <p className="text-xs text-muted">Utilizador</p>
            <p className="text-sm font-medium text-text">Operador ALIMENTA</p>
          </div>
          <button className="mt-4 w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
}
