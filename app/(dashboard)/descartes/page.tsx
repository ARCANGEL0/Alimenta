import PageHeader from '@/src/components/layout/PageHeader';
import Button from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Card } from '@/src/components/ui/card';
import { createServerClient } from '@/src/lib/postgres/server';
import { useState } from 'react';

type Descarte = {
  id: string;
  batch_internal_code: string | null;
  product_name: string | null;
  quantity: number;
  unit_code: string;
  reason_code: string;
  reason_notes: string | null;
  destination: string | null;
  disposed_at: string | null;
  created_by_name: string | null;
  created_at: string;
};

const MOTIVOS: { code: string; label: string }[] = [
  { code: 'expired', label: 'Validade ultrapassada' },
  { code: 'damaged_packaging', label: 'Embalagem danificada' },
  { code: 'improper_storage', label: 'Conservação inadequada' },
  { code: 'spoiled', label: 'Deterioração' },
  { code: 'preventive_recall', label: 'Recolha preventiva' },
  { code: 'other', label: 'Outro' },
];

async function listarDescartes(): Promise<Descarte[]> {
  const postgres = createServerClient();

  const { data, error } = await postgres
    .from('disposals')
    .select(`
      *,
      batches (internal_code),
      products (name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return (
    data?.map((item) => ({
      id: item.id,
      batch_internal_code: item.batches?.internal_code ?? null,
      product_name: item.products?.name ?? null,
      quantity: item.quantity,
      unit_code: item.unit_code,
      reason_code: item.reason_code,
      reason_notes: item.reason_notes,
      destination: item.destination,
      disposed_at: item.disposed_at,
      created_by_name: item.created_by_name ?? null,
      created_at: item.created_at,
    })) ?? []
  ) as Descarte[];
}

async function criarDescarte(formData: FormData) {
  'use server';

  const batch_id = formData.get('batch_id') as string;
  const quantity = Number(formData.get('quantity'));
  const reason_code = formData.get('reason_code') as string;
  const reason_notes = (formData.get('reason_notes') as string) || null;
  const destination = (formData.get('destination') as string) || null;

  const postgres = createServerClient();

  const { data: lote, error: erroLote } = await postgres
    .from('batches')
    .select('available_quantity, unit_code')
    .eq('id', batch_id)
    .single();

  if (erroLote || !lote) {
    return { erro: 'Lote não encontrado.' };
  }

  if (lote.available_quantity < quantity) {
    return { erro: 'Quantidade disponível insuficiente para o descarte.' };
  }

  if (reason_code === 'other' && (!reason_notes || reason_notes.trim() === '')) {
    return { erro: 'Para o motivo "outro" é obrigatório preencher a descrição.' };
  }

  const { error: erroDescarte } = await postgres
    .from('disposals')
    .insert({ batch_id, quantity, reason_code, reason_notes, destination });

  if (erroDescarte) {
    return { erro: 'Não foi possível registar o descarte.' };
  }

  const { error: erroMovimento } = await postgres
    .from('stock_movements')
    .insert({
      batch_id,
      movement_type: 'disposal',
      quantity,
      unit_code: lote.unit_code,
      source_type: 'disposal',
      reason: `Descarte: ${reason_code}`,
    });

  if (erroMovimento) {
    return { erro: 'Não foi possível registar o movimento.' };
  }

  return { sucesso: true };
}

export default function DescartesPage() {
  const [descartes, setDescartes] = useState<Descarte[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [batchId, setBatchId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reasonCode, setReasonCode] = useState('expired');
  const [reasonNotes, setReasonNotes] = useState('');
  const [destination, setDestination] = useState('');
  const [mostrarDescricao, setMostrarDescricao] = useState(false);

  async function carregar() {
    const lista = await listarDescartes();
    setDescartes(lista);
    setCarregando(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Descartes"
        description="Registo de perdas e destino dos alimentos."
        action={
          <Button onClick={() => setAbrirDialog(true)}>Novo descarte</Button>
        }
      />

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          abrirDialog ? '' : 'hidden'
        }`}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-md p-6">
          <h2 className="text-lg font-semibold text-text mb-4">Novo descarte</h2>
          <form action={criarDescarte} className="space-y-4">
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
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Motivo
              </label>
              <select
                value={reasonCode}
                onChange={(e) => {
                  setReasonCode(e.target.value);
                  setMostrarDescricao(e.target.value === 'other');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-forest"
              >
                {MOTIVOS.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            {mostrarDescricao && (
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Descrição (obrigatória)
                </label>
                <Input
                  value={reasonNotes}
                  onChange={(e) => setReasonNotes(e.target.value)}
                  placeholder="Descreva o motivo"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Destino / tipo de resíduo
              </label>
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Ex.: resíduo orgânico"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                onClick={() => {
                  setAbrirDialog(false);
                  setBatchId('');
                  setQuantity('');
                  setReasonCode('expired');
                  setReasonNotes('');
                  setDestination('');
                  setMostrarDescricao(false);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">Registar descarte</Button>
            </div>
          </form>
        </div>
      </div>

      {carregando ? (
        <div className="p-4 text-center text-muted">A carregar descartes…</div>
      ) : (
        <Card>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Lote
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Produto
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted">
                  Quantidade
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Motivo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted">
                  Data
                </th>
              </tr>
            </thead>
            <tbody>
              {descartes.map((descarte) => (
                <tr key={descarte.id} className="border-b border-gray-100">
                  <td className="px-4 py-3">{descarte.batch_internal_code ?? '—'}</td>
                  <td className="px-4 py-3">{descarte.product_name ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {descarte.quantity} {descarte.unit_code}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {MOTIVOS.find((m) => m.code === descarte.reason_code)?.label ?? descarte.reason_code}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(descarte.created_at).toLocaleString('pt-PT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
              {descartes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    Nenhum descarte registado.
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
