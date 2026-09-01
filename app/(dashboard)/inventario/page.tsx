import PageHeader from '@/src/components/layout/PageHeader';
import Button from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Card } from '@/src/components/ui/card';
import { createServerClient } from '@/src/lib/postgres/server';
import { useState } from 'react';

type Lote = {
  id: string;
  internal_code: string;
  product_name: string | null;
  received_at: string;
  expiry_date: string | null;
  expiry_type: string | null;
  on_hand_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  unit_code: string;
  status: string;
};

async function listarLotes(): Promise<Lote[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('batches')
    .select(`
      *,
      products (name)
    `)
    .order('received_at', { ascending: false });

  if (error) {
    return [];
  }

  return (
    data?.map((item) => ({
      id: item.id,
      internal_code: item.internal_code,
      product_name: item.products?.name ?? null,
      received_at: item.received_at,
      expiry_date: item.expiry_date,
      expiry_type: item.expiry_type,
      on_hand_quantity: item.on_hand_quantity,
      reserved_quantity: item.reserved_quantity,
      available_quantity: item.available_quantity,
      unit_code: item.unit_code,
      status: item.status,
    })) ?? []
  ) as Lote[];
}

async function criarLote(formData: FormData) {
  'use server';

  const internal_code = formData.get('internal_code') as string;
  const product_id = formData.get('product_id') as string;
  const warehouse_id = formData.get('warehouse_id') as string;
  const storage_location_id = (formData.get('storage_location_id') as string) || null;
  const received_at = formData.get('received_at') as string;
  const expiry_date = (formData.get('expiry_date') as string) || null;
  const expiry_type = (formData.get('expiry_type') as string) || null;
  const initial_quantity = Number(formData.get('initial_quantity'));
  const unit_code = formData.get('unit_code') as string;

  const postgres = createServerClient();
  const { error } = await postgres
    .from('batches')
    .insert({
      internal_code,
      product_id,
      warehouse_id,
      storage_location_id,
      received_at,
      expiry_date,
      expiry_type,
      initial_quantity,
      on_hand_quantity: initial_quantity,
      reserved_quantity: 0,
      available_quantity: initial_quantity,
      unit_code,
      status: 'available',
    });

  if (error) {
    return { erro: 'Não foi possível criar o lote.' };
  }

  return { sucesso: true };
}

export default function InventarioPage() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [internalCode, setInternalCode] = useState('');
  const [productId, setProductId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [storageLocationId, setStorageLocationId] = useState('');
  const [receivedAt, setReceivedAt] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryType, setExpiryType] = useState('');
  const [initialQuantity, setInitialQuantity] = useState('');
  const [unitCode, setUnitCode] = useState('');

  async function carregar() {
    const lista = await listarLotes();
    setLotes(lista);
    setCarregando(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventário por lote"
        description="Consulta o saldo de cada lote, movimentos e ajustes de stock."
        action={
          <Button onClick={() => setAbrirDialog(true)}>Novo lote</Button>
        }
      />

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          abrirDialog ? '' : 'hidden'
        }`}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-md p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Novo lote</h2>
          <form action={criarLote} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Código interno
              </label>
              <Input
                value={internalCode}
                onChange={(e) => setInternalCode(e.target.value)}
                placeholder="Ex.: LOTE-001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Produto
              </label>
              <Input
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="ID do produto"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Armazém
              </label>
              <Input
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                placeholder="ID do armazém"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Localização
              </label>
              <Input
                value={storageLocationId}
                onChange={(e) => setStorageLocationId(e.target.value)}
                placeholder="ID da localização (opcional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Data de receção
              </label>
              <Input
                type="datetime-local"
                value={receivedAt}
                onChange={(e) => setReceivedAt(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Validade
              </label>
              <Input
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                placeholder="AAAA-MM-DD (opcional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Tipo de validade
              </label>
              <Input
                value={expiryType}
                onChange={(e) => setExpiryType(e.target.value)}
                placeholder="use_by / best_before / none (opcional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Quantidade inicial
              </label>
              <Input
                type="number"
                value={initialQuantity}
                onChange={(e) => setInitialQuantity(e.target.value)}
                placeholder="0"
                required
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
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                onClick={() => {
                  setAbrirDialog(false);
                  setInternalCode('');
                  setProductId('');
                  setWarehouseId('');
                  setStorageLocationId('');
                  setReceivedAt('');
                  setExpiryDate('');
                  setExpiryType('');
                  setInitialQuantity('');
                  setUnitCode('');
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </div>
      </div>

      {carregando ? (
        <div className="p-4 text-center text-muted">A carregar lotes…</div>
      ) : (
        <Card>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Código interno
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Produto
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Receção
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Validade
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted">
                  Disponível
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {lotes.map((lote) => (
                <tr key={lote.id} className="border-b border-gray-100">
                  <td className="px-4 py-3">{lote.internal_code}</td>
                  <td className="px-4 py-3">{lote.product_name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(lote.received_at).toLocaleDateString('pt-PT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {lote.expiry_date ?? '—'} ({lote.expiry_type ?? '—'})
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {lote.available_quantity} {lote.unit_code}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                      {lote.status}
                    </span>
                  </td>
                </tr>
              ))}
              {lotes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    Nenhum lote registado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
