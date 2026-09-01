'use client';

import { Bell, User, Menu } from 'lucide-react';

export default function AppTopbar() {
  return (
    <header className="h-16 border-b border-gray-200 bg-surface flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 text-gray-600 hover:bg-gray-50 rounded-md">
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-text">ALIMENTA</h1>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-600 hover:bg-gray-50 rounded-md">
          <Bell className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="hidden md:flex flex-col items-end">
            <p className="text-sm font-medium text-text">Operador</p>
            <p className="text-xs text-muted">admin@alimenta.pt</p>
          </div>
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
            U
          </div>
        </div>
      </div>
    </header>
  );
}
