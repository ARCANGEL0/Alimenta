import PageHeader from '@/src/components/layout/PageHeader';
import Button from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Card } from '@/src/components/ui/card';
import { createServerClient } from '@/src/lib/postgres/server';
import { notFound, redirect } from 'next/navigation';
import { useEffect, useState } from 'react';

type Doacao = {
  id: string;
  reference: string;
  donor_id: string | null;
  donor_name: string | null;
  received_at: string;
  status: string;
  notes: string | null;
};

type Item = {
  id: string;
  product_name: string | null;
  quantity_received: number;
  quantity_accepted: number;
  quantity_rejected: number;
  unit_code: string;
  supplier_batch_code: string | null;
  expiry_date: string | null;
  expiry_type: string | null;
  inspection_status: string | null;
  inspection_notes: string | null;
};

async function buscarDoacao(id: string): Promise<Doacao | null> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('donations')
    .select(`
      *,
      donors (name)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    ...data,
    donor_name: data.donors?.name ?? null,
    donors: undefined,
  } as Doacao;
}

async function buscarItens(id: string): Promise<Item[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('donation_items')
    .select(`
      *,
      products (name)
    `)
    .eq('donation_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    return [];
  }

  return (
    data?.map((item) => ({
      ...item,
      product_name: item.products?.name ?? null,
      products: undefined,
    })) ?? []
  ) as Item[];
}

async function atualizarItem(
  id: string,
  accepted: number,
  rejected: number,
  status: string,
  notas: string | null,
) {
  'use server';

  const postgres = createServerClient();
  const { error } = await postgres
    .from('donation_items')
    .update({
      quantity_accepted: accepted,
      quantity_rejected: rejected,
      inspection_status: status,
      inspection_notes: notas,
    })
    .eq('id', id);

  if (error) {
    return { erro: 'Não foi possível atualizar o item.' };
  }

  return { sucesso: true };
}

export default function DoacaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [doacao, setDoacao] = useState<Doacao | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      const [d, i] = await Promise.all([buscarDoacao(id), buscarItens(id)]);
      if (!d) {
        notFound();
      }
      setDoacao(d);
      setItens(i);
      setCarregando(false);
    }

    carregar();
  }, [id]);

  if (carregando) {
    return (
      <div className="p-4 text-center text-muted">A carregar doação…</div>
    );
  }

  if (!doacao) {
    return notFound();
  }

  const totalRecebido = itens.reduce(
    (s, i) => s + Number(i.quantity_received),
    0,
  );
  const totalAceite = itens.reduce((s, i) => s + Number(i.quantity_accepted), 0);
  const totalRejeitado = itens.reduce(
    (s, i) => s + Number(i.quantity_rejected),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader title={`Doação ${doacao.reference}`} description="Detalhe, inspeção e itens da doação." />

      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="px-4 py-3">
            <p className="text-xs text-muted">Doador</p>
            <p className="text-sm text-text">{doacao.donor_name ?? '—'}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs text-muted">Data de receção</p>
            <p className="text-sm text-text">
              {new Date(doacao.received_at).toLocaleString('pt-PT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs text-muted">Estado</p>
            <p className="text-sm font-semibold text-text">
              {doacao.status}
            </p>
          </div>
        </div>
        {doacao.notes && (
          <div className="px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-muted">Observações</p>
            <p className="text-sm text-text">{doacao.notes}</p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card>
          <div className="px-4 py-3">
            <p className="text-xs text-muted">Total recebido</p>
            <p className="text-2xl font-semibold text-text">{totalRecebido}</p>
          </div>
        </Card>
        <Card>
          <div className="px-4 py-3">
            <p className="text-xs text-muted">Total aceite</p>
            <p className="text-2xl font-semibold text-text">{totalAceite}</p>
          </div>
        </Card>
        <Card>
          <div className="px-4 py-3">
            <p className="text-xs text-muted">Total rejeitado</p>
            <p className="text-2xl font-semibold text-text">{totalRejeitado}</p>
          </div>
        </Card>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                Produto
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                Recebido
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                Aceite
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                Rejeitado
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                Validade
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                Estado inspeção
              </th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="px-4 py-3">{item.product_name ?? '—'}</td>
                <td className="px-4 py-3">{item.quantity_received}</td>
                <td className="px-4 py-3">
                  <Input
                    value={String(item.quantity_accepted)}
                    onChange={() => {}}
                    disabled
                  />
                </td>
                <td className="px-4 py-3">{item.quantity_rejected}</td>
                <td className="px-4 py-3 text-muted">
                  {item.expiry_date ?? '—'} ({item.expiry_type ?? '—'})
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800">
                    {item.inspection_status ?? 'Pendente'}
                  </span>
                </td>
              </tr>
            ))}
            {itens.length === 0 && (
              <>
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    Nenhum item registado nesta doação.
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
