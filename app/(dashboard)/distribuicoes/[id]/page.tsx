import PageHeader from '@/src/components/layout/PageHeader';
import Button from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Card } from '@/src/components/ui/card';
import { createServerClient } from '@/src/lib/postgres/server';
import { notFound, redirect } from 'next/navigation';
import { useEffect, useState } from 'react';

type Distribuicao = {
  id: string;
  reference: string;
  household_id: string | null;
  household_code: string | null;
  status: string;
  scheduled_at: string | null;
  delivered_at: string | null;
  notes: string | null;
  created_at: string;
};

type Item = {
  id: string;
  product_name: string | null;
  quantity_requested: number | null;
  quantity_reserved: number;
  unit_code: string | null;
};

async function buscarDistribuicao(id: string): Promise<Distribuicao | null> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('distributions')
    .select(`
      *,
      households (code)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    ...data,
    household_code: data.households?.code ?? null,
    households: undefined,
  } as Distribuicao;
}

async function buscarItens(id: string): Promise<Item[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('distribution_items')
    .select(`
      *,
      products (name)
    `)
    .eq('distribution_id', id)
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

async function adicionarItem(formData: FormData) {
  'use server';

  const distribution_id = formData.get('distribution_id') as string;
  const product_id = (formData.get('product_id') as string) || null;
  const quantity_requested = Number(formData.get('quantity_requested'));
  const unit_code = (formData.get('unit_code') as string) || null;

  const postgres = createServerClient();
  const { error } = await postgres
    .from('distribution_items')
    .insert({ distribution_id, product_id, quantity_requested, unit_code });

  if (error) {
    return { erro: 'Não foi possível adicionar o item.' };
  }

  return { sucesso: true };
}

async function reservarStock(formData: FormData) {
  'use server';

  const distribution_item_id = formData.get('distribution_item_id') as string;
  const batch_id = formData.get('batch_id') as string;
  const quantity = Number(formData.get('quantity'));

  const postgres = createServerClient();

  const { data: lote, error: erroLote } = await postgres
    .from('batches')
    .select('available_quantity, reserved_quantity, on_hand_quantity')
    .eq('id', batch_id)
    .single();

  if (erroLote || !lote) {
    return { erro: 'Lote não encontrado.' };
  }

  if (lote.available_quantity < quantity) {
    return { erro: 'Quantidade disponível insuficiente.' };
  }

  const { error: erroReserva } = await postgres
    .from('stock_reservations')
    .insert({ distribution_item_id, batch_id, quantity, status: 'active' });

  if (erroReserva) {
    return { erro: 'Não foi possível criar a reserva.' };
  }

  const { error: erroUpdate } = await postgres
    .from('batches')
    .update({
      reserved_quantity: lote.reserved_quantity + quantity,
      available_quantity: lote.available_quantity - quantity,
      status: 'reserved',
      updated_at: new Date().toISOString(),
    })
    .eq('id', batch_id);

  if (erroUpdate) {
    return { erro: 'Não foi possível atualizar o saldo do lote.' };
  }

  return { sucesso: true };
}

export default function DistribuicaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [distribuicao, setDistribuicao] = useState<Distribuicao | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialogItem, setAbrirDialogItem] = useState(false);
  const [abrirDialogReserva, setAbrirDialogReserva] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<Item | null>(null);
  const [productId, setProductId] = useState('');
  const [quantityRequested, setQuantityRequested] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [batchId, setBatchId] = useState('');
  const [quantityReserva, setQuantityReserva] = useState('');

  useEffect(() => {
    async function carregar() {
      const [d, i] = await Promise.all([
        buscarDistribuicao(id),
        buscarItens(id),
      ]);
      if (!d) {
        notFound();
      }
      setDistribuicao(d);
      setItens(i);
      setCarregando(false);
    }

    carregar();
  }, [id]);

  if (carregando) {
    return (
      <div className="p-4 text-center text-muted">A carregar distribuição…</div>
    );
  }

  if (!distribuicao) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Distribuição ${distribuicao.reference}`}
        description="Itens, reservas de stock e confirmação de entrega."
      />

      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="px-4 py-3">
            <p className="text-xs text-muted">Agregado</p>
            <p className="text-sm text-text">
              {distribuicao.household_code ?? '—'}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs text-muted">Estado</p>
            <p className="text-sm font-semibold text-text">
              {distribuicao.status}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs text-muted">Criada em</p>
            <p className="text-sm text-text">
              {new Date(distribuicao.created_at).toLocaleString('pt-PT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        {distribuicao.notes && (
          <div className="px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-muted">Observações</p>
            <p className="text-sm text-text">{distribuicao.notes}</p>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text">Itens</h2>
        <Button
          onClick={() => {
            setItemSelecionado(null);
            setAbrirDialogItem(true);
          }}
        >
          Adicionar item
        </Button>
      </div>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          abrirDialogItem ? '' : 'hidden'
        }`}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-md p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Adicionar item</h2>
          <form action={adicionarItem} className="space-y-4">
            <input
              type="hidden"
              name="distribution_id"
              value={distribuicao.id}
            />
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Produto
              </label>
              <Input
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="ID do produto"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Quantidade pedida
              </label>
              <Input
                type="number"
                value={quantityRequested}
                onChange={(e) => setQuantityRequested(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Unidade
              </label>
              <Input
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)}
                placeholder="kg"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                onClick={() => {
                  setAbrirDialogItem(false);
                  setProductId('');
                  setQuantityRequested('');
                  setUnitCode('');
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">Adicionar</Button>
            </div>
          </form>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                Produto
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                Pedido
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                Reservado
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                Unidade
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                Reservar stock
              </th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="px-4 py-3">{item.product_name ?? '—'}</td>
                <td className="px-4 py-3">
                  {item.quantity_requested ?? '—'}
                </td>
                <td className="px-4 py-3">
                  {item.quantity_reserved} {item.unit_code}
                </td>
                <td className="px-4 py-3 text-muted">
                  {item.unit_code ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => {
                      setItemSelecionado(item);
                      setAbrirDialogReserva(true);
                    }}
                    className="text-xs text-forest hover:underline"
                  >
                    Reservar
                  </button>
                </td>
              </tr>
            ))}
            {itens.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Sem itens registados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          abrirDialogReserva ? '' : 'hidden'
        }`}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-md p-6">
          <h2 className="text-lg font-semibold text-text mb-4">
            Reservar stock — {itemSelecionado?.product_name ?? 'Item'}
          </h2>
          <form action={reservarStock} className="space-y-4">
            <input type="hidden" name="distribution_item_id" value={itemSelecionado?.id ?? ''} />
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Lote
              </label>
              <Input
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                placeholder="ID do lote"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Quantidade
              </label>
              <Input
                type="number"
                value={quantityReserva}
                onChange={(e) => setQuantityReserva(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                onClick={() => {
                  setAbrirDialogReserva(false);
                  setBatchId('');
                  setQuantityReserva('');
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">Reservar</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
