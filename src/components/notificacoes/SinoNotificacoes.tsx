'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

export default function SinoNotificacoes() {
  const [naoLidas, setNaoLidas] = useState<number>(0);
  const [aberta, setAberta] = useState(false);
  const [itens, setItens] = useState<Array<{ id: string; title: string; message: string; type: string }>>([]);

  async function carregar() {
    try {
      const r = await fetch('/api/notificacoes/contagem', { cache: 'no-store' });
      const json = await r.json();
      if (json.sucesso) setNaoLidas(Number(json.total));
    } catch {
      // falha silenciosa
    }
  }

  async function marcarTodas() {
    try {
      await fetch('/api/notificacoes/todas-lidas', { method: 'POST', cache: 'no-store' });
    } catch {
      // falha silenciosa
    }
    setNaoLidas(0);
    setItens([]);
  }

  useEffect(() => {
    carregar();
    const id = setInterval(carregar, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setAberta(!aberta)}
        className="relative rounded-full p-2.5 text-muted transition-colors hover:bg-forest/5 hover:text-forest"
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5" />
        {naoLidas > 0 && (
          <span className="absolute right-0 top-0 h-5 w-5 rounded-full bg-danger text-[10px] font-bold text-white flex items-center justify-center">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>
      {aberta && (
        <div className="absolute right-0 top-12 w-80 mt-2 rounded-xl border border-line bg-surface shadow-lg z-50">
          <div className="px-4 py-3 border-b border-line">
            <h3 className="text-sm font-semibold text-ink">Notificações</h3>
            <button
              onClick={marcarTodas}
              className="text-xs font-medium text-forest hover:underline"
            >
              Marcar todas como lidas
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {itens.length === 0 ? (
              <div className="px-4 py-6 text-center text-muted text-sm">
                Sem notificações não lidas
              </div>
            ) : (
              itens.map((item) => (
                <div key={item.id} className="px-4 py-3 border-b border-line last:border-0">
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  <p className="text-xs text-muted">{item.message}</p>
                  <span className={`text-xs font-bold ${item.type === 'danger' ? 'text-danger' : item.type === 'warning' ? 'text-warning' : 'text-secondary'}`}>
                    {item.type === 'danger' ? 'Urgente' : item.type === 'warning' ? 'Atenção' : 'Info'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
