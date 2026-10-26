'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export type CampoForm = {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'checkbox';
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  min?: number;
  step?: string;
};

type Resultado = { sucesso: boolean; erro?: string };

export default function Formulario<T extends Record<string, unknown>>({
  acao,
  campos,
  botao = 'Guardar',
  titulo,
}: {
  acao: (input: T) => Promise<Resultado>;
  campos: CampoForm[];
  botao?: string;
  titulo?: string;
}) {
  const router = useRouter();
  const [valores, setValores] = useState<Record<string, string | boolean>>({});
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErro('');
    setOk(false);
    const input: Record<string, unknown> = {};
    for (const c of campos) {
      const v = valores[c.name];
      if (c.type === 'checkbox') input[c.name] = Boolean(v);
      else if (v === '' || v === undefined) continue;
      else if (c.type === 'number') input[c.name] = Number(v);
      else input[c.name] = v;
    }
    try {
      const r = await acao(input as T);
      if (r.sucesso) {
        setOk(true);
        setValores({});
        router.refresh();
      } else {
        setErro(r.erro || 'Deu erro. Tenta outra vez.');
      }
    } catch {
      setErro('Não foi possível ligar ao servidor.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      {titulo && <h2 className="mb-4 text-sm font-semibold text-ink">{titulo}</h2>}
      <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
        {campos.map((c) => (
          <div key={c.name} className={c.type === 'checkbox' ? 'flex items-end pb-2 sm:col-span-2' : ''}>
            <label className="label-field w-full">
              {c.label}
              {c.type === 'checkbox' ? (
                <span className="mt-1 flex items-center gap-2 text-sm font-normal text-ink">
                  <input
                    type="checkbox"
                    checked={Boolean(valores[c.name])}
                    onChange={(e) => setValores({ ...valores, [c.name]: e.target.checked })}
                    className="h-4 w-4 rounded border-line accent-forest"
                  />
                  {c.placeholder ?? 'Sim'}
                </span>
              ) : c.type === 'select' ? (
                <select
                  className="input-field mt-1"
                  required={c.required}
                  value={String(valores[c.name] ?? '')}
                  onChange={(e) => setValores({ ...valores, [c.name]: e.target.value })}
                >
                  <option value="">— escolher —</option>
                  {(c.options ?? []).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={c.type ?? 'text'}
                  className="input-field mt-1"
                  placeholder={c.placeholder}
                  required={c.required}
                  min={c.min}
                  step={c.step}
                  value={String(valores[c.name] ?? '')}
                  onChange={(e) => setValores({ ...valores, [c.name]: e.target.value })}
                />
              )}
            </label>
          </div>
        ))}
        {erro && (
          <p role="alert" className="text-sm font-medium text-danger sm:col-span-2">
            {erro}
          </p>
        )}
        {ok && (
          <p className="text-sm font-medium text-forest sm:col-span-2">
            Guardado com sucesso.
          </p>
        )}
        <div className="sm:col-span-2">
          <button type="submit" disabled={busy} className="btn-primary disabled:opacity-70">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {botao}
          </button>
        </div>
      </form>
    </Card>
  );
}
