import PageHeader from '@/src/components/layout/PageHeader';
import { createServerClient } from '@/src/lib/postgres/server';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';

type Lote = {
  id: string;
  internal_code: string;
  product_name: string | null;
  on_hand_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  unit_code: string;
  status: string;
};

type Movimento = {
  id: string;
  movement_type: string;
  quantity: number;
  unit_code: string;
  reason: string | null;
  created_at: string;
  created_by_name: string | null;
};

async function buscarLote(id: string): Promise<Lote | null> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('batches')
    .select(`
      *,
      products (name)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    internal_code: data.internal_code,
    product_name: data.products?.name ?? null,
    on_hand_quantity: data.on_hand_quantity,
    reserved_quantity: data.reserved_quantity,
    available_quantity: data.available_quantity,
    unit_code: data.unit_code,
    status: data.status,
  } as Lote;
}

async function buscarMovimentos(id: string): Promise<Movimento[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('stock_movements')
    .select('*')
    .eq('batch_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return (data ?? []) as Movimento[];
}

const labelsMovimento: Record<string, string> = {
  receipt: 'Entrada',
  distribution: 'Saída (distribuição)',
  disposal: 'Descarte',
  adjustment_in: 'Ajuste de entrada',
  adjustment_out: 'Ajuste de saída',
  reservation_release: 'Libertação de reserva',
};

export default function LoteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [lote, setLote] = useState<Lote | null>(null);
  const [movimentos, setMovimentos] = useState<Movimento[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      const [l, m] = await Promise.all([buscarLote(id), buscarMovimentos(id)]);
      if (!l) {
        notFound();
      }
      setLote(l);
      setMovimentos(m);
      setCarregando(false);
    }

    carregar();
  }, [id]);

  if (carregando) {
    return (
      <div className="p-4 text-center text-muted">A carregar lote…</div>
    );
  }

  if (!lote) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Lote ${lote.internal_code}`}
        description="Saldo e histórico de movimentos do lote."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
          <p className="text-xs text-muted">Saldo físico</p>
          <p className="text-2xl font-semibold text-text">
            {lote.on_hand_quantity} {lote.unit_code}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
          <p className="text-xs text-muted">Reservado</p>
          <p className="text-2xl font-semibold text-text">
            {lote.reserved_quantity} {lote.unit_code}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
          <p className="text-xs text-muted">Disponível</p>
          <p className="text-2xl font-semibold text-text">
            {lote.available_quantity} {lote.unit_code}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
          <p className="text-xs text-muted">Estado</p>
          <p className="text-2xl font-semibold text-text">
            {lote.status}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-text">
            Histórico de movimentos
          </h2>
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                Quantidade
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                Motivo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                Data
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                Responsável
              </th>
            </tr>
          </thead>
          <tbody>
            {movimentos.map((movimento) => (
              <tr key={movimento.id} className="border-b border-gray-100">
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800">
                    {labelsMovimento[movimento.movement_type] ?? movimento.movement_type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {movimento.quantity} {movimento.unit_code}
                </td>
                <td className="px-4 py-3 text-muted">
                  {movimento.reason ?? '—'}
                </td>
                <td className="px-4 py-3 text-muted">
                  {new Date(movimento.created_at).toLocaleString('pt-PT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-4 py-3 text-muted">
                  {movimento.created_by_name ?? '—'}
                </td>
              </tr>
            ))}
            {movimentos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Sem movimentos registados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
