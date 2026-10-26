'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function BotaoAcao({
  acao,
  children,
  className,
}: {
  acao: () => Promise<{ sucesso: boolean; erro?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState('');

  async function clicar() {
    setBusy(true);
    setErro('');
    try {
      const r = await acao();
      if (r.sucesso) router.refresh();
      else setErro(r.erro || 'Deu erro.');
    } catch {
      setErro('Servidor em baixo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" onClick={clicar} disabled={busy} className={className}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        {children}
      </button>
      {erro && (
        <span role="alert" className="text-xs text-danger">
          {erro}
        </span>
      )}
    </span>
  );
}
